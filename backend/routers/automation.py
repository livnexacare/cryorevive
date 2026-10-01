import os
from datetime import date, timedelta

from fastapi import APIRouter, Header, HTTPException, BackgroundTasks
from pydantic import BaseModel

from database import db_fetch, db_fetchrow
from utils.whatsapp import send_whatsapp_text
from utils.email_sender import send_invoice_email, send_membership_reminder_email

router = APIRouter(prefix="/api", tags=["automation"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


# ── WhatsApp message templates ──────────────────────────────

def membership_reminder_message(
    name: str,
    sessions_remaining: int,
    days_left: int,
    package: str,
) -> str:
    if sessions_remaining <= 2:
        emoji = "⚠️"
        urgency = f"Only *{sessions_remaining} sessions* remaining!"
    elif days_left <= 7:
        emoji = "⏰"
        urgency = f"Your membership expires in *{days_left} days*!"
    else:
        emoji = "💪"
        urgency = f"You have *{sessions_remaining} sessions* left this month."

    return f"""{emoji} *CryoRevive — Recovery Reminder*

Hi *{name}* 👋

Your *{package}* membership update:

📊 Sessions Remaining: *{sessions_remaining}*
📅 Days Until Expiry: *{days_left} days*

{urgency}

Book your next session now and keep your recovery on track!

👉 Book: https://www.cryorevive.in/booking
📞 Call/WhatsApp: +91 8595850920

_C-168, Omnicron 1, Mathurapur, Greater Noida_
_Near Optimal Fitness Gym_

RECOVER • RESET • PERFORM 🔥"""


def invoice_whatsapp_message(
    name: str,
    invoice_no: str,
    service: str,
    amount: int,
    date_str: str,
) -> str:
    return f"""🧾 *CryoRevive — Invoice*

Hi *{name}* 👋

Thank you for your visit! Here's your invoice:

📋 *Invoice No:* {invoice_no}
🏋️ *Service:* {service}
📅 *Date:* {date_str}
📍 *Place of Supply:* 09 - Uttar Pradesh
💳 *Amount Paid:* ₹{amount:,}

*GST Breakup:*
- Taxable Value: ₹{int(amount / 1.18):,}
- CGST @ 9%: ₹{int((amount - amount / 1.18) / 2):,}
- SGST @ 9%: ₹{int((amount - amount / 1.18) / 2):,}

_Livnexa Care Pvt. Ltd. | GSTIN: 09AAGCL7757C1Z9_

We look forward to seeing you again! 💪
📞 +91 8595850920 | 🌐 www.cryorevive.in"""


# Human-readable service names for messages/emails — booking.service_type
# keys match the ones used across invoice.py / dashboard.tsx.
SERVICE_NAMES = {
    "ice_bath": "Ice Bath Session",
    "steam_sauna": "Steam Sauna Session",
    "contrast_therapy": "Contrast Therapy",
    "cryo_chamber": "Cryo Chamber Session",
    "compression_therapy": "Compression Therapy",
    "full_body_recovery": "Full Body Recovery",
    "cupping_therapy": "Cupping Therapy",
    "deep_tissue_massage": "Deep Tissue Massage",
    "physiotherapy": "Physiotherapy Session",
    "kneeva": "Kneeva Recovery Session",
}


# ── INVOICE AUTOMATION ──────────────────────────────────────

class SendInvoiceRequest(BaseModel):
    booking_id: str
    send_whatsapp: bool = True
    send_email: bool = True


@router.post("/automation/send-invoice")
async def send_invoice(
    data: SendInvoiceRequest,
    background_tasks: BackgroundTasks,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    row = await db_fetchrow("SELECT * FROM bookings WHERE id = $1", data.booking_id)
    if not row:
        raise HTTPException(404, "Booking not found")

    booking = dict(row)

    if booking.get("payment_status") not in ("paid", "partial"):
        raise HTTPException(400, "Invoice only for paid bookings")

    if not booking.get("amount"):
        raise HTTPException(400, "Booking has no amount set")

    # Deterministic invoice number — same scheme as backend/utils/invoice.py's
    # generate_invoice_number(), so the number quoted here always matches the
    # PDF the customer can download from the admin dashboard.
    year = str(booking.get("date") or "2026")[:4]
    next_year = str(int(year) + 1)[2:]
    short_id = str(booking["id"]).replace("-", "")[:6].upper()
    invoice_no = f"CR/{year[2:]}-{next_year}/{short_id}"

    service_name = SERVICE_NAMES.get(
        booking.get("service_type", ""),
        (booking.get("service_type") or "Recovery Service").replace("_", " ").title(),
    )

    results = {"booking_id": data.booking_id, "invoice_no": invoice_no}

    # Send WhatsApp
    if data.send_whatsapp and booking.get("phone"):
        try:
            msg = invoice_whatsapp_message(
                name=booking.get("name", ""),
                invoice_no=invoice_no,
                service=service_name,
                amount=booking["amount"],
                date_str=str(booking.get("date", "")),
            )
            wa_result = await send_whatsapp_text(booking["phone"], msg)
            results["whatsapp"] = "sent" if "messages" in wa_result else wa_result
        except Exception as e:
            results["whatsapp"] = f"failed: {str(e)}"

    # Send Email
    if data.send_email and booking.get("email"):
        email = booking["email"]
        # Skip dummy emails generated for WhatsApp/staff-only bookings
        if "@whatsapp.booking" not in email and "@staff.booking" not in email:
            try:
                send_invoice_email(
                    to_email=email,
                    client_name=booking.get("name", ""),
                    invoice_number=invoice_no,
                    service_name=service_name,
                    amount=booking["amount"],
                    date=str(booking.get("date", "")),
                )
                results["email"] = "sent"
            except Exception as e:
                results["email"] = f"failed: {str(e)}"
        else:
            results["email"] = "skipped (no real email)"

    return results


# ── MEMBER REMINDERS ─────────────────────────────────────────

@router.post("/automation/send-member-reminders")
async def send_member_reminders(
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    """
    Send reminders to active members: always when sessions are low or expiry
    is near, otherwise only on the weekly Sunday run. Triggered by the
    weekly-reminders GitHub Actions cron, or manually from the admin
    dashboard's Members tab.
    """
    _require_admin(x_admin_key)

    today = date.today()

    rows = await db_fetch(
        """SELECT * FROM memberships
           WHERE status = 'active'
           ORDER BY sessions_remaining ASC"""
    )

    results = {"total": len(rows), "sent": [], "skipped": [], "failed": []}

    for row in rows:
        m = dict(row)
        name = m.get("client_name", "Member")
        phone = m.get("client_mobile", "")
        sessions_remaining = m.get("sessions_remaining") or 0
        end_date = m.get("end_date")
        package = m.get("package_name", "Membership")

        if not phone:
            results["skipped"].append({"name": name, "reason": "no phone"})
            continue

        days_left = 999
        if end_date:
            end = end_date if isinstance(end_date, date) else date.fromisoformat(str(end_date))
            days_left = (end - today).days

        should_send = (
            sessions_remaining <= 3
            or days_left <= 7
            or today.weekday() == 6  # Sunday
        )

        if not should_send:
            results["skipped"].append({"name": name, "reason": "not due for reminder"})
            continue

        try:
            msg = membership_reminder_message(
                name=name,
                sessions_remaining=sessions_remaining,
                days_left=days_left,
                package=package,
            )
            wa_result = await send_whatsapp_text(phone, msg)
            results["sent"].append({
                "name": name,
                "phone": phone[-4:],  # last 4 digits only, for privacy in the response
                "sessions_remaining": sessions_remaining,
                "days_left": days_left,
                "wa_status": "sent" if "messages" in wa_result else "failed",
            })
        except Exception as e:
            results["failed"].append({"name": name, "error": str(e)})

    return results


@router.post("/automation/send-expiry-alerts")
async def send_expiry_alerts(
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    """Send alerts for memberships expiring in the next 7 days."""
    _require_admin(x_admin_key)

    today = date.today()
    week_later = today + timedelta(days=7)

    rows = await db_fetch(
        """SELECT * FROM memberships
           WHERE status = 'active'
           AND end_date BETWEEN $1 AND $2""",
        today, week_later,
    )

    results = {"expiring_soon": len(rows), "sent": [], "failed": []}

    for row in rows:
        m = dict(row)
        end = m["end_date"]
        end = end if isinstance(end, date) else date.fromisoformat(str(end))
        days_left = (end - today).days

        try:
            msg = f"""⏰ *CryoRevive — Membership Expiring Soon*

Hi *{m['client_name']}* 👋

Your *{m['package_name']}* membership expires in *{days_left} days* ({m['end_date']}).

📊 Sessions remaining: *{m.get('sessions_remaining', 0)}*

Don't let your sessions go to waste! Book now or renew your membership.

👉 Book: https://www.cryorevive.in/booking
📞 Renew: +91 8595850920

RECOVER • RESET • PERFORM 🔥"""

            await send_whatsapp_text(m["client_mobile"], msg)
            results["sent"].append(m["client_name"])
        except Exception as e:
            results["failed"].append({"name": m["client_name"], "error": str(e)})

    return results
