import os
import uuid
import asyncio
from datetime import date as Date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from database import db_execute, db_fetchrow, db_fetch, row_to_dict, rows_to_list
from models.booking import BookingIn, BookingStatusUpdate
from utils.email import send_booking_received, send_booking_confirmed
from utils.slots import get_available_slots

router = APIRouter(prefix="/api", tags=["bookings"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/bookings", status_code=201)
async def create_booking(payload: BookingIn):
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
    return {"id": booking_id, "message": "Booking received. We'll confirm your slot shortly."}


@router.get("/slots")
async def get_slots(
    date: Date = Query(..., description="YYYY-MM-DD"),
    service_type: str = Query(..., description="ice_bath | steam_sauna | contrast_therapy | mobile_unit"),
):
    try:
        rows = await db_fetch(
            """SELECT time_slot FROM bookings
               WHERE date = $1::date AND service_type = $2 AND status != 'cancelled'""",
            date, service_type
        )
    except Exception as e:
        print(f"ERROR get_slots: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch slots")

    booked = [r["time_slot"] for r in rows]
    available = get_available_slots(booked)
    return {
        "date": date,
        "service_type": service_type,
        "available_slots": available,
        "booked_slots": booked,
    }


@router.get("/bookings")
async def list_bookings(
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
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
