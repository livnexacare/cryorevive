from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import boto3
import resend
import asyncpg
from botocore.config import Config
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# -------------------- DB pool (asyncpg) --------------------
DATABASE_URL = os.environ['DATABASE_URL']
_pool: asyncpg.Pool = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        import ssl as _ssl
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        _pool = await asyncpg.create_pool(
            DATABASE_URL, min_size=2, max_size=10, ssl=ctx, statement_cache_size=0
        )
    return _pool


async def db_fetch(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)


async def db_fetchrow(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)


async def db_execute(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)


def row_to_dict(row) -> Optional[dict]:
    return dict(row) if row is not None else None


def rows_to_list(rows) -> list:
    return [dict(r) for r in rows]


# -------------------- Cloudflare R2 --------------------
R2_ACCOUNT_ID     = os.environ.get('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY_ID  = os.environ.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_KEY     = os.environ.get('R2_SECRET_KEY', '')
R2_BUCKET         = os.environ.get('R2_BUCKET', 'cryorevive')
R2_PUBLIC_URL     = os.environ.get('R2_PUBLIC_URL', '').rstrip('/')

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _r2_client():
    return boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto',
    )


def r2_put(path: str, data: bytes, content_type: str) -> str:
    """Upload to Cloudflare R2, return public URL."""
    try:
        _r2_client().put_object(
            Bucket=R2_BUCKET,
            Key=path,
            Body=data,
            ContentType=content_type,
        )
    except Exception as e:
        logger.error("R2 upload failed: %s", e)
        raise HTTPException(status_code=503, detail="Storage upload failed")
    return f"{R2_PUBLIC_URL}/{path}" if R2_PUBLIC_URL else path


# -------------------- App --------------------
app = FastAPI(title="CryoRevive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cryo-revive-main.vercel.app",
        "https://cryorevive.com",
        "https://www.cryorevive.com",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*livnexacares-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

# -------------------- Models --------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

class BookingIn(BaseModel):
    service: Literal["ice_bath", "steam_sauna", "contrast_therapy", "mobile_unit"]
    date: str                      # YYYY-MM-DD
    time_slot: str                 # e.g. "10:00"
    duration_minutes: Literal[15, 30, 45, 60] = 30
    guests: int = 1
    name: str
    email: EmailStr
    phone: str
    notes: Optional[str] = ""

class BookingStatusIn(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "completed"]

class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    subject: str
    message: str

# -------------------- Helpers --------------------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode("utf-8"), h.encode("utf-8"))
    except Exception:
        return False

def new_session_token() -> str:
    return secrets.token_urlsafe(48)

def public_user(doc: dict) -> dict:
    return {
        "user_id": doc["user_id"],
        "email": doc["email"],
        "name": doc.get("name", ""),
        "role": doc.get("role", "customer"),
        "picture": doc.get("picture"),
    }

async def create_session(user_id: str, token: Optional[str] = None, days: int = 7) -> str:
    token = token or new_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=days)
    await db_execute(
        """INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (session_token) DO NOTHING""",
        str(uuid.uuid4()), user_id, token, expires, datetime.now(timezone.utc)
    )
    return token

def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 60 * 60, path="/",
    )

def clear_session_cookie(response: Response):
    response.delete_cookie(key="session_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = row_to_dict(await db_fetchrow(
        "SELECT * FROM user_sessions WHERE session_token = $1", token
    ))
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = row_to_dict(await db_fetchrow("SELECT * FROM users WHERE user_id = $1", sess["user_id"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# -------------------- Auth --------------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
    if await db_fetchrow("SELECT id FROM users WHERE email = $1", email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db_execute(
        """INSERT INTO users (id, user_id, email, name, role, password_hash, auth_provider, created_at)
           VALUES ($1, $2, $3, $4, 'customer', $5, 'password', $6)""",
        str(uuid.uuid4()), user_id, email,
        payload.name.strip() or email.split("@")[0],
        hash_password(payload.password), datetime.now(timezone.utc)
    )
    doc = row_to_dict(await db_fetchrow("SELECT * FROM users WHERE user_id = $1", user_id))
    token = await create_session(user_id)
    set_session_cookie(response, token)
    return public_user(doc)


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = row_to_dict(await db_fetchrow("SELECT * FROM users WHERE email = $1", email))
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = await create_session(user["user_id"])
    set_session_cookie(response, token)
    return public_user(user)


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db_execute("DELETE FROM user_sessions WHERE session_token = $1", token)
    clear_session_cookie(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api.patch("/account/password")
async def change_password(payload: ChangePasswordIn, user: dict = Depends(get_current_user)):
    if user.get("auth_provider") != "password":
        raise HTTPException(status_code=400, detail="Only email/password accounts can change password")
    if not verify_password(payload.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    await db_execute(
        "UPDATE users SET password_hash = $1 WHERE user_id = $2",
        hash_password(payload.new_password), user["user_id"]
    )
    return {"ok": True}


# -------------------- Password reset --------------------
resend.api_key = os.environ.get("RESEND_API_KEY", "")

def _resend_send_sync(params: dict):
    try:
        result = resend.Emails.send(params)
        return result.get("id") if isinstance(result, dict) else None
    except Exception as e:
        logger.error("Resend send failed: %s", e)
        return None


@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordIn):
    if not resend.api_key:
        raise HTTPException(status_code=503, detail="Email service not configured")
    email = payload.email.lower().strip()
    user = row_to_dict(await db_fetchrow("SELECT * FROM users WHERE email = $1", email))
    if not user or user.get("auth_provider") != "password":
        return {"ok": True}
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db_execute(
        "INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used) VALUES ($1, $2, $3, $4, false)",
        str(uuid.uuid4()), user["id"], token, expires
    )
    frontend_url = os.environ.get("FRONTEND_URL", "https://cryo-revive-main.vercel.app")
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    reset_url = f"{frontend_url}/reset-password?token={token}"
    asyncio.create_task(asyncio.to_thread(_resend_send_sync, {
        "from": f"CryoRevive <{sender}>",
        "to": [email],
        "subject": "Reset your CryoRevive password",
        "html": f"""
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
          <div style="background:#0ea5e9;padding:24px;color:#fff;">
            <h2 style="margin:0;font-size:20px;">Password reset · CryoRevive</h2>
          </div>
          <div style="padding:24px;background:#fff;">
            <p style="font-size:15px;margin:0 0 16px;">
              Click below to reset your password. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="{reset_url}"
               style="display:inline-block;padding:12px 28px;background:#0ea5e9;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">
              Reset password →
            </a>
            <p style="font-size:12px;color:#6B7280;margin:20px 0 0;">
              If you didn't request this, you can ignore this email.
            </p>
          </div>
        </div>""",
    }))
    return {"ok": True}


@api.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordIn):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    row = row_to_dict(await db_fetchrow(
        "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE", payload.token
    ))
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    expires_at = row["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset link has expired — please request a new one")
    await db_execute(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        hash_password(payload.new_password), row["user_id"]
    )
    await db_execute("UPDATE password_reset_tokens SET used = TRUE WHERE token = $1", payload.token)
    return {"ok": True}


# -------------------- Bookings --------------------
SERVICE_LABELS = {
    "ice_bath":         "Ice Bath Therapy",
    "steam_sauna":      "Steam Sauna",
    "contrast_therapy": "Contrast Therapy",
    "mobile_unit":      "Mobile Recovery Unit",
}


def _booking_confirmation_html(booking: dict) -> str:
    label = SERVICE_LABELS.get(booking.get("service", ""), booking.get("service", ""))
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#0ea5e9;padding:24px;color:#fff;">
        <h1 style="margin:0;font-size:22px;">Booking confirmed · {booking['booking_id']}</h1>
        <p style="margin:6px 0 0;font-size:12px;opacity:0.9;letter-spacing:0.15em;text-transform:uppercase;">CryoRevive · Elite Recovery</p>
      </div>
      <div style="padding:24px;background:#fff;">
        <p style="font-size:15px;margin:0 0 8px;">Hi {booking.get('name','')},</p>
        <p style="font-size:14px;color:#4B5563;margin:0 0 20px;">
          Your session has been booked. We'll confirm the final details by phone before your appointment.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:4px;">
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;font-weight:600;">Service</td>
            <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;">{label}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;">Date</td>
            <td style="padding:12px 16px;font-size:14px;color:#111827;">{booking.get('date','')}</td>
          </tr>
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;">Time</td>
            <td style="padding:12px 16px;font-size:14px;color:#111827;">{booking.get('time_slot','')}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;">Duration</td>
            <td style="padding:12px 16px;font-size:14px;color:#111827;">{booking.get('duration_minutes', 30)} min</td>
          </tr>
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;">Guests</td>
            <td style="padding:12px 16px;font-size:14px;color:#111827;">{booking.get('guests', 1)}</td>
          </tr>
        </table>
        {f"<p style='font-size:13px;color:#6B7280;margin:16px 0 0;'>Notes: {booking.get('notes')}</p>" if booking.get('notes') else ''}
      </div>
      <div style="background:#F1F5F9;padding:14px 24px;">
        <p style="margin:0;font-size:12px;color:#6B7280;">Questions? Reply to this email · info@cryorevive.com</p>
      </div>
    </div>"""


def _booking_admin_html(booking: dict) -> str:
    label = SERVICE_LABELS.get(booking.get("service", ""), booking.get("service", ""))
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#111827;padding:20px;color:#fff;">
        <h2 style="margin:0;font-size:18px;">🔔 New booking · {booking['booking_id']}</h2>
      </div>
      <div style="padding:20px;background:#fff;">
        <p style="margin:0 0 4px;font-size:14px;"><strong>{booking.get('name','')}</strong> · {booking.get('phone','')}</p>
        <p style="margin:0 0 12px;font-size:13px;color:#4B5563;">{booking.get('email','')}</p>
        <p style="font-size:14px;margin:0;"><strong>{label}</strong> · {booking.get('date','')} at {booking.get('time_slot','')} · {booking.get('duration_minutes',30)} min · {booking.get('guests',1)} guest(s)</p>
        {f"<p style='font-size:13px;color:#6B7280;margin:8px 0 0;'>Notes: {booking.get('notes')}</p>" if booking.get('notes') else ''}
      </div>
    </div>"""


@api.post("/bookings")
async def create_booking(payload: BookingIn):
    booking_id = f"bk_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    await db_execute(
        """INSERT INTO bookings
           (id, booking_id, service, date, time_slot, duration_minutes, guests,
            name, email, phone, notes, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12)""",
        str(uuid.uuid4()), booking_id, payload.service, payload.date,
        payload.time_slot, payload.duration_minutes, payload.guests,
        payload.name.strip(), str(payload.email), payload.phone.strip(),
        payload.notes or "", now
    )
    booking = row_to_dict(await db_fetchrow("SELECT * FROM bookings WHERE booking_id = $1", booking_id))
    asyncio.create_task(_dispatch_booking_emails(booking))
    return booking


async def _dispatch_booking_emails(booking: dict) -> None:
    if not resend.api_key:
        return
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    admin_email = os.environ.get("ADMIN_EMAIL", "info@cryorevive.com")
    force_to = os.environ.get("RESEND_FORCE_RECIPIENT", "").strip()
    customer_email = booking.get("email", "")
    try:
        await asyncio.to_thread(_resend_send_sync, {
            "from": f"CryoRevive <{sender}>",
            "to": [force_to or admin_email],
            "subject": f"[CryoRevive] New booking {booking['booking_id']} · {booking.get('name','')}",
            "html": _booking_admin_html(booking),
            "reply_to": [customer_email],
        })
        await asyncio.sleep(1.0)
        await asyncio.to_thread(_resend_send_sync, {
            "from": f"CryoRevive <{sender}>",
            "to": [force_to or customer_email],
            "subject": f"Booking confirmed · {booking['booking_id']} · CryoRevive",
            "html": _booking_confirmation_html(booking),
        })
    except Exception as e:
        logger.error("Booking email dispatch error: %s", e)


@api.get("/bookings/my")
async def my_bookings(user: dict = Depends(get_current_user)):
    rows = await db_fetch(
        "SELECT * FROM bookings WHERE email = $1 ORDER BY created_at DESC",
        user["email"]
    )
    return rows_to_list(rows)


@api.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    row = row_to_dict(await db_fetchrow("SELECT * FROM bookings WHERE booking_id = $1", booking_id))
    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")
    if row["email"] != user["email"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return row


# -------------------- Contact --------------------
@api.post("/contact")
async def contact(payload: ContactIn):
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    support = os.environ.get("SUPPORT_EMAIL", "info@cryorevive.com")
    force_to = os.environ.get("RESEND_FORCE_RECIPIENT", "").strip()
    now = datetime.now(timezone.utc)
    if not resend.api_key:
        await db_execute(
            """INSERT INTO contact_queries (id, name, email, phone, subject, message, email_sent, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,false,$7)""",
            str(uuid.uuid4()), payload.name, str(payload.email),
            payload.phone, payload.subject, payload.message, now
        )
        raise HTTPException(status_code=503, detail="Email service not configured")
    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#0ea5e9;padding:20px;color:#fff;">
        <h2 style="margin:0;font-size:18px;">CryoRevive · New Contact Query</h2>
      </div>
      <div style="padding:20px;background:#fff;">
        <p style="margin:0 0 4px;"><strong>{payload.name}</strong> · {payload.phone}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#4B5563;">{payload.email}</p>
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#6B7280;">Subject</p>
        <p style="margin:0 0 16px;font-size:15px;">{payload.subject}</p>
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#6B7280;">Message</p>
        <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">{payload.message}</p>
      </div>
    </div>"""
    try:
        result = await asyncio.to_thread(_resend_send_sync, {
            "from": f"CryoRevive <{sender}>",
            "to": [force_to or support],
            "subject": f"[CryoRevive] {payload.subject} · {payload.name}",
            "html": html,
            "reply_to": [str(payload.email)],
        })
        email_id = result if isinstance(result, str) else None
        await db_execute(
            """INSERT INTO contact_queries (id, name, email, phone, subject, message, email_sent, email_id, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8)""",
            str(uuid.uuid4()), payload.name, str(payload.email),
            payload.phone, payload.subject, payload.message, email_id, now
        )
    except Exception as e:
        logger.error("Contact email error: %s", e)
        raise HTTPException(status_code=502, detail="Could not send your message. Please try again.")
    return {"ok": True}


# -------------------- Upload (Cloudflare R2) --------------------
@api.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), _: dict = Depends(require_admin)):
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, or GIF images are allowed")
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin").lower()
    path = f"uploads/{uuid.uuid4().hex}.{ext}"
    public_url = r2_put(path, data, ct)
    return {"path": path, "url": public_url, "size": len(data)}


# -------------------- Admin --------------------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total_bookings = (await db_fetchrow("SELECT COUNT(*) FROM bookings"))["count"]
    pending = (await db_fetchrow("SELECT COUNT(*) FROM bookings WHERE status = 'pending'"))["count"]
    confirmed = (await db_fetchrow("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'"))["count"]
    completed = (await db_fetchrow("SELECT COUNT(*) FROM bookings WHERE status = 'completed'"))["count"]
    users_count = (await db_fetchrow("SELECT COUNT(*) FROM users"))["count"]
    recent = rows_to_list(await db_fetch(
        "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10"
    ))
    return {
        "total_bookings": total_bookings,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "users": users_count,
        "recent_bookings": recent,
    }


@api.get("/admin/bookings")
async def admin_list_bookings(
    status: Optional[str] = None,
    _: dict = Depends(require_admin)
):
    if status:
        rows = await db_fetch(
            "SELECT * FROM bookings WHERE status = $1 ORDER BY created_at DESC LIMIT 500", status
        )
    else:
        rows = await db_fetch("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 500")
    return rows_to_list(rows)


@api.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(
    booking_id: str,
    payload: BookingStatusIn,
    _: dict = Depends(require_admin)
):
    existing = row_to_dict(await db_fetchrow("SELECT * FROM bookings WHERE booking_id = $1", booking_id))
    if not existing:
        raise HTTPException(status_code=404, detail="Booking not found")
    await db_execute(
        "UPDATE bookings SET status = $1 WHERE booking_id = $2", payload.status, booking_id
    )
    asyncio.create_task(_dispatch_booking_status_email({**existing, "status": payload.status}, payload.status))
    return {"ok": True, "status": payload.status}


BOOKING_STATUS_COPY = {
    "confirmed": ("Your booking is confirmed", "Great news — your session has been confirmed. We look forward to seeing you!"),
    "cancelled":  ("Your booking has been cancelled", "Your session has been cancelled. If this is unexpected, please reply to this email."),
    "completed":  ("Session complete — thank you!", "Thanks for visiting CryoRevive. We hope you had a great recovery session!"),
}

async def _dispatch_booking_status_email(booking: dict, status: str) -> None:
    if not resend.api_key or status not in BOOKING_STATUS_COPY:
        return
    title, body = BOOKING_STATUS_COPY[status]
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    force_to = os.environ.get("RESEND_FORCE_RECIPIENT", "").strip()
    customer_email = booking.get("email", "")
    label = SERVICE_LABELS.get(booking.get("service", ""), booking.get("service", ""))
    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#0ea5e9;padding:22px;color:#fff;">
        <h1 style="margin:0;font-size:20px;">{title}</h1>
        <p style="margin:6px 0 0;font-size:12px;opacity:0.9;letter-spacing:0.15em;text-transform:uppercase;">
          Booking {booking['booking_id']}
        </p>
      </div>
      <div style="padding:22px;background:#fff;">
        <p style="margin:0 0 10px;font-size:15px;">Hi {booking.get('name','')},</p>
        <p style="margin:0 0 14px;font-size:14px;color:#4B5563;">{body}</p>
        <p style="font-size:14px;margin:0;">
          <strong>{label}</strong> · {booking.get('date','')} at {booking.get('time_slot','')}
        </p>
      </div>
      <div style="background:#F1F5F9;padding:14px 22px;">
        <p style="margin:0;font-size:12px;color:#6B7280;">Reply for support · info@cryorevive.com</p>
      </div>
    </div>"""
    try:
        await asyncio.to_thread(_resend_send_sync, {
            "from": f"CryoRevive <{sender}>",
            "to": [force_to or customer_email],
            "subject": f"CryoRevive · {title} · {booking['booking_id']}",
            "html": html,
        })
    except Exception as e:
        logger.error("Booking status email error: %s", e)


@api.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, _: dict = Depends(require_admin)):
    res = await db_execute("DELETE FROM bookings WHERE booking_id = $1", booking_id)
    if res == "DELETE 0":
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True}


@api.get("/admin/contact-queries")
async def admin_list_queries(_: dict = Depends(require_admin)):
    return rows_to_list(await db_fetch("SELECT * FROM contact_queries ORDER BY created_at DESC LIMIT 500"))


@api.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    return rows_to_list(await db_fetch(
        "SELECT id, user_id, email, name, role, auth_provider, created_at FROM users ORDER BY created_at DESC LIMIT 500"
    ))


# -------------------- Startup / Shutdown --------------------
@app.on_event("startup")
async def startup():
    await get_pool()
    logger.info("DB pool ready")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@cryorevive.com").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    if not await db_fetchrow("SELECT id FROM users WHERE email = $1", admin_email):
        await db_execute(
            """INSERT INTO users (id, user_id, email, name, role, password_hash, auth_provider, created_at)
               VALUES ($1,$2,$3,'CryoRevive Admin','admin',$4,'password',$5)""",
            str(uuid.uuid4()), f"user_{uuid.uuid4().hex[:12]}",
            admin_email, hash_password(admin_password), datetime.now(timezone.utc)
        )
        logger.info("Seeded admin %s", admin_email)


@app.on_event("shutdown")
async def shutdown():
    global _pool
    if _pool:
        await _pool.close()


# -------------------- Health --------------------
@api.get("/")
async def health():
    return {"ok": True, "service": "cryorevive"}


app.include_router(api)
