import os
import asyncio
import logging
import resend

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")

SENDER      = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@cryorevive.com")
FORCE_TO    = os.environ.get("RESEND_FORCE_RECIPIENT", "").strip()

SERVICE_LABELS = {
    "ice_bath":         "Ice Bath Therapy",
    "steam_sauna":      "Steam Sauna",
    "contrast_therapy": "Contrast Therapy",
    "mobile_unit":      "Mobile Recovery Unit",
}


def _to(intended: str) -> list[str]:
    return [FORCE_TO] if FORCE_TO else [intended]


def _send_sync(params: dict) -> str | None:
    try:
        result = resend.Emails.send(params)
        return result.get("id") if isinstance(result, dict) else None
    except Exception as e:
        logger.error("Resend failed: %s", e)
        return None


async def send_async(params: dict) -> str | None:
    return await asyncio.to_thread(_send_sync, params)


# -------------------- Booking emails --------------------
def _booking_confirmation_html(b: dict) -> str:
    label = SERVICE_LABELS.get(b.get("service_type", ""), b.get("service_type", ""))
    notes_row = f"<tr><td style='padding:10px 14px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;'>Notes</td><td style='padding:10px 14px;font-size:14px;color:#111827;'>{b['notes']}</td></tr>" if b.get("notes") else ""
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#0ea5e9;padding:24px;color:#fff;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">Booking received · {b['id']}</h1>
        <p style="margin:6px 0 0;font-size:12px;opacity:.9;letter-spacing:.15em;text-transform:uppercase;">CryoRevive · Elite Recovery</p>
      </div>
      <div style="padding:24px;background:#fff;">
        <p style="font-size:15px;margin:0 0 8px;">Hi {b['name']},</p>
        <p style="font-size:14px;color:#4B5563;margin:0 0 20px;line-height:1.6;">
          Your session has been received. We'll confirm the details by phone before your appointment.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:4px;overflow:hidden;">
          <tr style="background:#F9FAFB;"><td style="padding:10px 14px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;width:120px;">Service</td><td style="padding:10px 14px;font-size:14px;font-weight:600;color:#111827;">{label}</td></tr>
          <tr><td style="padding:10px 14px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;">Date</td><td style="padding:10px 14px;font-size:14px;color:#111827;">{b['date']}</td></tr>
          <tr style="background:#F9FAFB;"><td style="padding:10px 14px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;">Time</td><td style="padding:10px 14px;font-size:14px;color:#111827;">{b['time_slot']}</td></tr>
          <tr><td style="padding:10px 14px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;">Phone</td><td style="padding:10px 14px;font-size:14px;color:#111827;">{b['phone']}</td></tr>
          {notes_row}
        </table>
      </div>
      <div style="background:#F1F5F9;padding:14px 24px;">
        <p style="margin:0;font-size:12px;color:#6B7280;">Questions? Reply to this email · info@cryorevive.com</p>
      </div>
    </div>"""


def _booking_admin_html(b: dict) -> str:
    label = SERVICE_LABELS.get(b.get("service_type", ""), b.get("service_type", ""))
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#111827;padding:20px;color:#fff;">
        <h2 style="margin:0;font-size:18px;">🔔 New booking · {b['id']}</h2>
      </div>
      <div style="padding:20px;background:#fff;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;">{b['name']}</p>
        <p style="margin:0 0 2px;font-size:13px;color:#4B5563;">{b['email']} · {b['phone']}</p>
        <p style="margin:12px 0 0;font-size:14px;"><strong>{label}</strong> · {b['date']} at {b['time_slot']}</p>
        {f"<p style='font-size:13px;color:#6B7280;margin:6px 0 0;'>Notes: {b['notes']}</p>" if b.get('notes') else ''}
      </div>
    </div>"""


def _booking_confirmed_html(b: dict) -> str:
    label = SERVICE_LABELS.get(b.get("service_type", ""), b.get("service_type", ""))
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#16a34a;padding:24px;color:#fff;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">✓ Booking confirmed · {b['id']}</h1>
        <p style="margin:6px 0 0;font-size:12px;opacity:.9;letter-spacing:.15em;text-transform:uppercase;">CryoRevive · Elite Recovery</p>
      </div>
      <div style="padding:24px;background:#fff;">
        <p style="font-size:15px;margin:0 0 8px;">Hi {b['name']},</p>
        <p style="font-size:14px;color:#4B5563;margin:0 0 20px;line-height:1.6;">
          Your payment was successful and your session is confirmed. See you soon!
        </p>
        <p style="font-size:14px;margin:0;"><strong>{label}</strong> · {b['date']} at {b['time_slot']}</p>
      </div>
      <div style="background:#F1F5F9;padding:14px 24px;">
        <p style="margin:0;font-size:12px;color:#6B7280;">info@cryorevive.com · CryoRevive</p>
      </div>
    </div>"""


async def send_booking_received(booking: dict) -> None:
    if not resend.api_key:
        return
    customer_email = booking.get("email", "")
    try:
        await send_async({
            "from": f"CryoRevive <{SENDER}>",
            "to": _to(ADMIN_EMAIL),
            "subject": f"[CryoRevive] New booking {booking['id']} · {booking['name']}",
            "html": _booking_admin_html(booking),
            "reply_to": [customer_email],
        })
        await asyncio.sleep(1.0)
        await send_async({
            "from": f"CryoRevive <{SENDER}>",
            "to": _to(customer_email),
            "subject": f"Booking received · {booking['id']} · CryoRevive",
            "html": _booking_confirmation_html(booking),
        })
    except Exception as e:
        logger.error("send_booking_received error: %s", e)


async def send_booking_confirmed(booking: dict) -> None:
    if not resend.api_key:
        return
    customer_email = booking.get("email", "")
    try:
        await send_async({
            "from": f"CryoRevive <{SENDER}>",
            "to": _to(customer_email),
            "subject": f"✓ Payment confirmed · {booking['id']} · CryoRevive",
            "html": _booking_confirmed_html(booking),
        })
    except Exception as e:
        logger.error("send_booking_confirmed error: %s", e)


# -------------------- Contact email --------------------
async def send_contact_notification(name: str, email: str, message: str) -> None:
    if not resend.api_key:
        return
    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;max-width:620px;margin:0 auto;">
      <div style="background:#0ea5e9;padding:20px;color:#fff;">
        <h2 style="margin:0;font-size:18px;">CryoRevive · New Contact Query</h2>
      </div>
      <div style="padding:20px;background:#fff;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;">{name}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#4B5563;">{email}</p>
        <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">{message}</p>
      </div>
    </div>"""
    try:
        await send_async({
            "from": f"CryoRevive <{SENDER}>",
            "to": _to(ADMIN_EMAIL),
            "subject": f"[CryoRevive] Contact query from {name}",
            "html": html,
            "reply_to": [email],
        })
    except Exception as e:
        logger.error("send_contact_notification error: %s", e)
