import os
import asyncio
from datetime import date as Date, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel, Field

from database import db_execute, db_fetch, db_fetchrow, row_to_dict, rows_to_list
from utils.auth import generate_temp_password, hash_password, verify_password
from utils.email import send_booking_received
from utils.whatsapp import send_whatsapp_notifications

router = APIRouter(prefix="/api", tags=["clients"])

STAFF_KEY = os.environ.get("STAFF_API_KEY", "")
ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_staff(key: str) -> None:
    if not key or key not in (STAFF_KEY, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


StaffRole = Literal["receptionist", "therapist", "manager"]


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
    amount: Optional[int] = 0   # amount to collect in INR (final, after discount)
    notes: Optional[str] = None


class StaffAccountCreate(BaseModel):
    username: str
    password: str = Field(min_length=6)
    full_name: str
    role: StaffRole = "receptionist"


class StaffAccountUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[StaffRole] = None
    is_active: Optional[bool] = None


class StaffLogin(BaseModel):
    username: str
    password: str


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=6)


class CustomSlotCreate(BaseModel):
    time_slot: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


class CustomSlotUpdate(BaseModel):
    is_active: bool


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
             amount, status, payment_status, notes
           ) VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8,$9,$10)
           RETURNING *""",
        data.full_name.strip(),
        data.email or f"{data.mobile}@staff.booking",
        data.mobile.strip(), data.service_type, data.date, data.time_slot,
        data.amount or 0, status, payment_status,
        f"Staff booking | Client: {data.client_id} | Payment: {data.payment_method} | {data.notes or ''}",
    )
    booking = row_to_dict(row)
    asyncio.create_task(send_booking_received(booking))
    asyncio.create_task(send_whatsapp_notifications(booking))
    return booking


# ── Staff Account Routes (admin-managed) ────────────────────────────────────


@router.get("/staff/accounts")
async def list_staff(x_admin_key: str = Header("", alias="X-Admin-Key")):
    _require_admin(x_admin_key)
    rows = await db_fetch(
        """SELECT id, username, full_name, role, is_active, last_login, created_at
           FROM staff_accounts
           ORDER BY created_at DESC"""
        # Never return password_hash
    )
    return rows_to_list(rows)


@router.post("/staff/accounts", status_code=201)
async def create_staff(
    data: StaffAccountCreate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    username = data.username.strip().lower()

    existing = await db_fetchrow(
        "SELECT id FROM staff_accounts WHERE username = $1", username
    )
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    row = await db_fetchrow(
        """INSERT INTO staff_accounts (username, password_hash, full_name, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, username, full_name, role, is_active, created_at""",
        username,
        hash_password(data.password),
        data.full_name.strip(),
        data.role,
    )
    return row_to_dict(row)


@router.patch("/staff/accounts/{staff_id}")
async def update_staff(
    staff_id: str,
    data: StaffAccountUpdate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields = [f"{k} = ${i + 1}" for i, k in enumerate(update_data.keys())]
    values = list(update_data.values())
    values.append(staff_id)

    await db_execute(
        f"UPDATE staff_accounts SET {', '.join(fields)}, updated_at = NOW() WHERE id = ${len(values)}",
        *values,
    )
    row = await db_fetchrow(
        "SELECT id, username, full_name, role, is_active, created_at FROM staff_accounts WHERE id = $1",
        staff_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Staff account not found")
    return row_to_dict(row)


@router.post("/staff/accounts/{staff_id}/reset-password")
async def reset_staff_password(
    staff_id: str,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    temp_password = generate_temp_password()
    result = await db_execute(
        "UPDATE staff_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        hash_password(temp_password),
        staff_id,
    )
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Staff account not found")
    return {"temp_password": temp_password, "message": "Password reset. Share with staff."}


@router.delete("/staff/accounts/{staff_id}")
async def delete_staff(
    staff_id: str,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    await db_execute("DELETE FROM staff_accounts WHERE id = $1", staff_id)
    return {"status": "deleted"}


# ── Staff Login ──────────────────────────────────────────────────────────────
# Identifies which staff member is using the shared X-Staff-Key for the rest
# of the staff PWA (tracks last_login / role for UI purposes only — the actual
# API authorization is still the shared STAFF_API_KEY, unchanged).


@router.post("/staff/login")
async def staff_login(data: StaffLogin):
    username = data.username.strip().lower()

    row = await db_fetchrow(
        """SELECT id, username, password_hash, full_name, role, is_active
           FROM staff_accounts WHERE username = $1""",
        username,
    )
    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    account = row_to_dict(row)

    if not account["is_active"]:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact admin.")

    if not verify_password(data.password, account["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    await db_execute("UPDATE staff_accounts SET last_login = NOW() WHERE id = $1", account["id"])

    return {
        "success": True,
        "staff_id": str(account["id"]),
        "username": account["username"],
        "full_name": account["full_name"],
        "role": account["role"],
    }


# ── Admin Password Reset ─────────────────────────────────────────────────────


@router.post("/admin/reset-password")
async def reset_admin_password(
    data: AdminPasswordReset,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    """Admin resets their own password. ADMIN_USERNAME/PASSWORD live in Vercel
    env vars for the frontend login check — the backend can't change those,
    so this just confirms the new value and returns manual-update instructions."""
    _require_admin(x_admin_key)
    return {
        "message": "To reset the admin password, update ADMIN_PASSWORD in Vercel env vars",
        "new_password": data.new_password,
        "instruction": "Go to Vercel → cryo-revive-main → Settings → Environment Variables → ADMIN_PASSWORD",
    }


# ── Custom Time Slots ─────────────────────────────────────────────────────────


@router.get("/admin/slots")
async def get_all_slots(x_admin_key: str = Header("", alias="X-Admin-Key")):
    _require_admin(x_admin_key)
    rows = await db_fetch("SELECT * FROM custom_slots ORDER BY created_at ASC")
    return rows_to_list(rows)


@router.patch("/admin/slots/{slot_id}")
async def toggle_slot(
    slot_id: str,
    data: CustomSlotUpdate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    await db_execute(
        "UPDATE custom_slots SET is_active = $1 WHERE id = $2",
        data.is_active,
        slot_id,
    )
    return {"status": "updated"}


@router.post("/admin/slots", status_code=201)
async def add_custom_slot(
    data: CustomSlotCreate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    row = await db_fetchrow(
        """INSERT INTO custom_slots (time_slot)
           VALUES ($1) ON CONFLICT (time_slot) DO UPDATE
           SET is_active = true
           RETURNING *""",
        data.time_slot,
    )
    return row_to_dict(row)
