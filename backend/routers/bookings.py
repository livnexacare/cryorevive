import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database import db_execute, db_fetchrow, db_fetch, row_to_dict, rows_to_list
from models.booking import BookingIn
from utils.email import send_booking_received
from utils.slots import get_available_slots

router = APIRouter(prefix="/api", tags=["bookings"])


@router.post("/bookings")
async def create_booking(payload: BookingIn):
    # Prevent double-booking the same slot
    conflict = await db_fetchrow(
        """SELECT id FROM bookings
           WHERE date = $1 AND time_slot = $2 AND service_type = $3
             AND status NOT IN ('cancelled')""",
        payload.date, payload.time_slot, payload.service_type
    )
    if conflict:
        raise HTTPException(status_code=409, detail="This slot is already booked. Please choose another time.")

    booking_id = f"bk_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    await db_execute(
        """INSERT INTO bookings
           (id, booking_id, name, email, phone, service_type, date, time_slot, notes, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10)""",
        str(uuid.uuid4()), booking_id,
        payload.name.strip(), str(payload.email), payload.phone.strip(),
        payload.service_type, payload.date, payload.time_slot,
        payload.notes or "", now
    )
    booking = row_to_dict(await db_fetchrow(
        "SELECT * FROM bookings WHERE booking_id = $1", booking_id
    ))
    asyncio.create_task(send_booking_received(booking))
    return {"booking_id": booking_id, "message": "Booking received. We'll confirm shortly."}


@router.get("/slots")
async def get_slots(
    date: str = Query(..., description="YYYY-MM-DD"),
    service_type: str = Query(..., description="ice_bath | steam_sauna | contrast_therapy | mobile_unit"),
):
    rows = await db_fetch(
        """SELECT time_slot FROM bookings
           WHERE date = $1 AND service_type = $2 AND status NOT IN ('cancelled')""",
        date, service_type
    )
    booked = [r["time_slot"] for r in rows]
    available = get_available_slots(booked)
    return {"date": date, "service_type": service_type, "available_slots": available, "booked_slots": booked}
