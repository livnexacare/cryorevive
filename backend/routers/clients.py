import os
import asyncio
from datetime import date as Date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel

from database import db_fetch, db_fetchrow, row_to_dict, rows_to_list
from utils.email import send_booking_received
from utils.whatsapp import send_whatsapp_notifications

router = APIRouter(prefix="/api", tags=["clients"])

STAFF_KEY = os.environ.get("STAFF_API_KEY", "")
ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_staff(key: str) -> None:
    if not key or key not in (STAFF_KEY, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="Forbidden")


class ClientIn(BaseModel):
    full_name: str
    mobile: str
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    health_high_bp: bool = False
    health_heart: bool = False
    health_asthma: bool = False
    health_seizures: bool = False
    health_diabetes: bool = False
    health_pregnancy: bool = False
    health_other: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_relation: Optional[str] = None
    referral_source: Optional[str] = None
    referral_code: Optional[str] = None
    first_time: bool = True


class StaffBookingIn(BaseModel):
    client_id: str
    full_name: str
    mobile: str
    email: Optional[str] = None
    service_type: str
    date: Date
    time_slot: str
    payment_method: str  # cash | online
    notes: Optional[str] = None


@router.get("/clients/search")
async def search_clients(
    q: str = Query(..., min_length=2),
    x_staff_key: str = Header("", alias="X-Staff-Key"),
):
    _require_staff(x_staff_key)
    rows = await db_fetch(
        """SELECT * FROM clients
           WHERE mobile ILIKE $1 OR full_name ILIKE $1
           ORDER BY updated_at DESC LIMIT 10""",
        f"%{q}%",
    )
    return rows_to_list(rows)


@router.get("/clients/{client_id}")
async def get_client(
    client_id: str,
    x_staff_key: str = Header("", alias="X-Staff-Key"),
):
    _require_staff(x_staff_key)
    row = await db_fetchrow("SELECT * FROM clients WHERE id = $1", client_id)
    if not row:
        raise HTTPException(status_code=404, detail="Client not found")
    return row_to_dict(row)


@router.post("/clients")
async def upsert_client(
    data: ClientIn,
    x_staff_key: str = Header("", alias="X-Staff-Key"),
):
    _require_staff(x_staff_key)
    row = await db_fetchrow(
        """INSERT INTO clients (
             full_name, mobile, email, age, gender, address,
             health_high_bp, health_heart, health_asthma,
             health_seizures, health_diabetes, health_pregnancy,
             health_other, emergency_name, emergency_phone,
             emergency_relation, referral_source, referral_code,
             first_time, total_sessions
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
             $13,$14,$15,$16,$17,$18,$19,1
           )
           ON CONFLICT (mobile) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             age = EXCLUDED.age,
             gender = EXCLUDED.gender,
             address = EXCLUDED.address,
             health_high_bp = EXCLUDED.health_high_bp,
             health_heart = EXCLUDED.health_heart,
             health_asthma = EXCLUDED.health_asthma,
             health_seizures = EXCLUDED.health_seizures,
             health_diabetes = EXCLUDED.health_diabetes,
             health_pregnancy = EXCLUDED.health_pregnancy,
             health_other = EXCLUDED.health_other,
             emergency_name = EXCLUDED.emergency_name,
             emergency_phone = EXCLUDED.emergency_phone,
             emergency_relation = EXCLUDED.emergency_relation,
             referral_source = EXCLUDED.referral_source,
             referral_code = EXCLUDED.referral_code,
             updated_at = NOW(),
             total_sessions = clients.total_sessions + 1
           RETURNING *""",
        data.full_name.strip(), data.mobile.strip(), data.email, data.age,
        data.gender, data.address, data.health_high_bp,
        data.health_heart, data.health_asthma, data.health_seizures,
        data.health_diabetes, data.health_pregnancy, data.health_other,
        data.emergency_name, data.emergency_phone, data.emergency_relation,
        data.referral_source, data.referral_code, data.first_time,
    )
    return row_to_dict(row)


@router.post("/staff/booking", status_code=201)
async def staff_create_booking(
    data: StaffBookingIn,
    x_staff_key: str = Header("", alias="X-Staff-Key"),
):
    _require_staff(x_staff_key)

    today = Date.today()
    if data.date < today:
        raise HTTPException(status_code=400, detail="Cannot book for a past date")
    if data.date > today + timedelta(days=90):
        raise HTTPException(status_code=400, detail="Cannot book more than 90 days in advance")
    if data.payment_method not in ("cash", "online"):
        raise HTTPException(status_code=400, detail="payment_method must be 'cash' or 'online'")

    conflict = await db_fetchrow(
        """SELECT id FROM bookings
           WHERE date = $1::date AND time_slot = $2
             AND service_type = $3 AND status != 'cancelled'""",
        data.date, data.time_slot, data.service_type,
    )
    if conflict:
        raise HTTPException(status_code=409, detail="This slot is already booked")

    payment_status = "paid" if data.payment_method == "cash" else "unpaid"
    status = "confirmed" if data.payment_method == "cash" else "pending"

    row = await db_fetchrow(
        """INSERT INTO bookings (
             name, email, phone, service_type, date, time_slot,
             status, payment_status, notes
           ) VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8,$9)
           RETURNING *""",
        data.full_name.strip(),
        data.email or f"{data.mobile}@staff.booking",
        data.mobile.strip(), data.service_type, data.date, data.time_slot,
        status, payment_status,
        f"Staff booking | Client: {data.client_id} | Payment: {data.payment_method} | {data.notes or ''}",
    )
    booking = row_to_dict(row)
    asyncio.create_task(send_booking_received(booking))
    asyncio.create_task(send_whatsapp_notifications(booking))
    return booking
