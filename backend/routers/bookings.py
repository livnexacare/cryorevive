import os
import uuid
import asyncio
from datetime import date as Date, datetime, timezone, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Header, HTTPException, Query

from database import db_execute, db_fetchrow, db_fetch, row_to_dict, rows_to_list
from models.booking import BookingIn, BookingStatusUpdate, BookingUpdate
from utils.email import send_booking_received, send_booking_confirmed
from utils.whatsapp import send_whatsapp_notifications
from utils.slots import MASTER_SLOTS

IST = ZoneInfo("Asia/Kolkata")

router = APIRouter(prefix="/api", tags=["bookings"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/bookings", status_code=201)
async def create_booking(payload: BookingIn):
    today = Date.today()
    if payload.date < today:
        raise HTTPException(status_code=400, detail="Cannot book for a past date")
    if payload.date > today + timedelta(days=90):
        raise HTTPException(status_code=400, detail="Cannot book more than 90 days in advance")

    # Prevent double-booking the same slot
    conflict = await db_fetchrow(
        """SELECT id FROM bookings
           WHERE date = $1::date AND time_slot = $2 AND service_type = $3
             AND status != 'cancelled'""",
        payload.date, payload.time_slot, payload.service_type
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="This slot is already booked. Please choose another time."
        )

    booking_id = str(uuid.uuid4())
    try:
        await db_execute(
            """INSERT INTO bookings
               (id, name, email, phone, service_type, date, time_slot, notes,
                status, payment_status, created_at)
               VALUES ($1,$2,$3,$4,$5,$6::date,$7,$8,'pending','unpaid',$9)""",
            booking_id,
            payload.name.strip(), str(payload.email), payload.phone.strip(),
            payload.service_type, payload.date, payload.time_slot,
            payload.notes or "", datetime.now(timezone.utc)
        )
    except Exception as e:
        print(f"ERROR create_booking: {e}")
        raise HTTPException(status_code=500, detail="Failed to create booking")

    booking = row_to_dict(await db_fetchrow("SELECT * FROM bookings WHERE id = $1", booking_id))
    asyncio.create_task(send_booking_received(booking))
    asyncio.create_task(send_whatsapp_notifications(booking))
    return {"id": booking_id, "message": "Booking received. We'll confirm your slot shortly."}


@router.get("/slots")
async def get_slots(
    date: Date = Query(..., description="YYYY-MM-DD"),
    service_type: str = Query(..., description="ice_bath | steam_sauna | contrast_therapy | mobile_unit"),
):
    try:
        slot_rows = await db_fetch(
            "SELECT time_slot FROM custom_slots WHERE is_active = true ORDER BY time_slot ASC"
        )
        master_slots = [r["time_slot"] for r in slot_rows] or MASTER_SLOTS

        rows = await db_fetch(
            """SELECT time_slot FROM bookings
               WHERE date = $1::date AND service_type = $2 AND status != 'cancelled'""",
            date, service_type
        )
    except Exception as e:
        print(f"ERROR get_slots: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch slots")

    booked = [r["time_slot"] for r in rows]
    booked_set = set(booked)

    # Slots are stored/compared in local (IST) wall-clock time since the
    # studio is physically in Greater Noida, India.
    now_ist = datetime.now(IST)
    is_today = date == now_ist.date()

    available = []
    for slot in master_slots:
        if slot in booked_set:
            continue
        if is_today:
            hour, minute = map(int, slot.split(":"))
            slot_dt = now_ist.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if slot_dt <= now_ist:
                continue
        available.append(slot)

    return {
        "date": date,
        "service_type": service_type,
        "available_slots": available,
        "booked_slots": booked,
    }


@router.get("/bookings")
async def list_bookings(
    status: Optional[str] = Query(None),
    date: Optional[Date] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    x_admin_key: str = Header(default=""),
):
    _require_admin(x_admin_key)

    conditions: list[str] = []
    params: list = []

    if status:
        params.append(status)
        conditions.append(f"status = ${len(params)}")
    if date:
        params.append(date)
        conditions.append(f"date = ${len(params)}::date")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    params.append(limit)
    limit_ph = f"${len(params)}"

    rows = await db_fetch(
        f"SELECT * FROM bookings {where} ORDER BY created_at DESC LIMIT {limit_ph}",
        *params,
    )
    return rows_to_list(rows)


@router.get("/bookings/user")
async def get_user_bookings(email: str = Query(...)):
    """Get bookings for a specific user email — no auth required (filtered by email)"""
    try:
        rows = await db_fetch(
            """SELECT * FROM bookings
               WHERE email = $1
               ORDER BY created_at DESC
               LIMIT 50""",
            email,
        )
        return rows_to_list(rows)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, x_admin_key: str = Header(default="")):
    _require_admin(x_admin_key)
    row = await db_fetchrow("SELECT * FROM bookings WHERE id = $1", booking_id)
    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")
    return row_to_dict(row)


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    payload: BookingStatusUpdate,
    x_admin_key: str = Header(default=""),
):
    _require_admin(x_admin_key)

    existing = await db_fetchrow("SELECT * FROM bookings WHERE id = $1", booking_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Booking not found")

    await db_execute(
        "UPDATE bookings SET status = $1 WHERE id = $2",
        payload.status, booking_id,
    )

    updated = row_to_dict(await db_fetchrow("SELECT * FROM bookings WHERE id = $1", booking_id))

    if payload.status == "confirmed" and existing["payment_status"] == "unpaid":
        asyncio.create_task(send_booking_confirmed(updated))

    return updated


@router.patch("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    data: BookingUpdate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    """Full edit of a booking — status, payment_status, service_type, date,
    time_slot, notes. Unlike /bookings/{id}/status, any subset of fields may
    be updated in one call."""
    _require_admin(x_admin_key)

    existing = await db_fetchrow("SELECT id FROM bookings WHERE id = $1", booking_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Booking not found")

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields = [f"{k} = ${i + 1}" for i, k in enumerate(update_data.keys())]
    values = list(update_data.values())
    values.append(booking_id)

    await db_execute(
        f"UPDATE bookings SET {', '.join(fields)} WHERE id = ${len(values)}",
        *values,
    )
    return row_to_dict(await db_fetchrow("SELECT * FROM bookings WHERE id = $1", booking_id))


@router.post("/bookings/{booking_id}/cancel-unpaid")
async def cancel_unpaid_booking(booking_id: str):
    """Self-service cancel for the customer's own just-created booking when the
    Razorpay checkout is closed without completing payment — otherwise the slot
    stays reserved indefinitely. No admin key required: this can only ever
    affect a booking still in the pending+unpaid state it starts in, and
    booking_id is an unguessable UUID, so it can't be used to touch anyone
    else's confirmed or paid booking."""
    result = await db_execute(
        """UPDATE bookings SET status = 'cancelled'
           WHERE id = $1 AND status = 'pending' AND payment_status = 'unpaid'""",
        booking_id,
    )
    return {"cancelled": result == "UPDATE 1"}


@router.post("/test-email")
async def test_email(x_admin_key: str = Header(None, alias="X-Admin-Key")):
    _require_admin(x_admin_key)
    from utils.email import test_email_config
    results = await test_email_config()
    return results
