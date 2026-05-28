import os
import asyncio
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")

# Hardcoded — works on Resend free/trial without domain verification
SENDER = "CryoRevive <onboarding@resend.dev>"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

SERVICE_LABELS = {
    "ice_bath":         "Ice Bath Therapy",
    "steam_sauna":      "Steam Sauna",
    "contrast_therapy": "Contrast Therapy",
    "mobile_unit":      "Mobile Recovery Unit",
}


async def send_booking_emails(booking: dict) -> None:
    """Send confirmation to customer + notification to admin."""
    if not resend.api_key:
        print("[EMAIL] RESEND_API_KEY not set — skipping email")
        return

    customer_email = booking.get("email", "")

    # Placeholder email used for WhatsApp bookings — skip customer email
    if "@whatsapp.booking" in customer_email:
        print("[EMAIL] WhatsApp booking — sending admin notification only")
        await _send_admin_notification(booking)
        return

    try:
        r = resend.Emails.send({
            "from": SENDER,
            "to": [customer_email],
            "subject": "Your CryoRevive Booking is Confirmed 🧊",
            "html": _customer_html(booking),
        })
        print(f"[EMAIL] Customer email sent: {r}")
    except Exception as e:
        print(f"[EMAIL] Customer email failed: {e}")

    await _send_admin_notification(booking)


async def _send_admin_notification(booking: dict) -> None:
    if not ADMIN_EMAIL:
        print("[EMAIL] ADMIN_EMAIL not set — skipping admin notification")
        return
    service = booking.get("service_type", "").replace("_", " ").title()
    try:
        r = resend.Emails.send({
            "from": SENDER,
            "to": [ADMIN_EMAIL],
            "subject": f"New Booking — {booking.get('name')} — {service}",
            "html": _admin_html(booking),
        })
        print(f"[EMAIL] Admin notification sent: {r}")
    except Exception as e:
        print(f"[EMAIL] Admin notification failed: {e}")


def _customer_html(b: dict) -> str:
    service = SERVICE_LABELS.get(b.get("service_type", ""), b.get("service_type", "").replace("_", " ").title())
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#0a0f1e;color:#ffffff;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#06b6d4;font-size:28px;margin:0;">CryoRevive</h1>
        <p style="color:#94a3b8;font-size:12px;letter-spacing:2px;
                  text-transform:uppercase;margin:4px 0 0;">
          Elite Recovery
        </p>
      </div>

      <div style="background:#1e293b;border-radius:8px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#22d3ee;margin:0 0 16px;">&#9989; Booking Confirmed!</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#94a3b8;padding:8px 0;font-size:14px;">Service</td>
            <td style="color:#fff;font-weight:bold;font-size:14px;">{service}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;padding:8px 0;font-size:14px;">Date</td>
            <td style="color:#fff;font-weight:bold;font-size:14px;">{b.get('date', '')}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;padding:8px 0;font-size:14px;">Time</td>
            <td style="color:#fff;font-weight:bold;font-size:14px;">{b.get('time_slot', '')}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;padding:8px 0;font-size:14px;">Name</td>
            <td style="color:#fff;font-weight:bold;font-size:14px;">{b.get('name', '')}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;padding:8px 0;font-size:14px;">Payment</td>
            <td style="color:#fbbf24;font-weight:bold;font-size:14px;">Pay at venue</td>
          </tr>
        </table>
      </div>

      <div style="background:#0f172a;border:1px solid #1e40af;
                  border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="color:#93c5fd;font-size:14px;margin:0;">
          &#128205; Please arrive 10 minutes before your session.<br>
          &#128241; We'll confirm your slot via WhatsApp shortly.<br>
          &#10067; Questions? WhatsApp us at +91 09891430920
        </p>
      </div>

      <p style="color:#475569;font-size:12px;text-align:center;">
        CryoRevive &mdash; Recover Harder. Come Back Stronger.<br>
        www.cryorevive.in
      </p>
    </div>
    """


def _admin_html(b: dict) -> str:
    service = SERVICE_LABELS.get(b.get("service_type", ""), b.get("service_type", "").replace("_", " ").title())
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#f8fafc;padding:32px;border-radius:12px;">
      <h2 style="color:#0f172a;margin:0 0 20px;">
        &#128276; New Booking &mdash; {b.get('name', '')}
      </h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;
                    border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;">
          <td style="color:#94a3b8;padding:12px 16px;font-size:13px;width:40%;">Field</td>
          <td style="color:#fff;padding:12px 16px;font-size:13px;">Value</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Name</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:14px;">{b.get('name', '')}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;background:#f8fafc;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Email</td>
          <td style="padding:12px 16px;font-size:14px;">{b.get('email', '')}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Phone</td>
          <td style="padding:12px 16px;font-size:14px;">{b.get('phone', '')}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;background:#f8fafc;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Service</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:14px;">{service}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Date</td>
          <td style="padding:12px 16px;font-size:14px;">{b.get('date', '')}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;background:#f8fafc;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Time</td>
          <td style="padding:12px 16px;font-size:14px;">{b.get('time_slot', '')}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">Notes</td>
          <td style="padding:12px 16px;font-size:14px;">{b.get('notes', '&mdash;')}</td>
        </tr>
      </table>
      <div style="margin-top:20px;padding:16px;background:#fef3c7;
                  border-radius:8px;border-left:4px solid #f59e0b;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          &#9889; Action needed: Confirm this booking via WhatsApp to the customer.
        </p>
      </div>
    </div>
    """


# ── Backward-compat aliases used by bookings.py, payments.py ──────────────────

async def send_booking_received(booking: dict) -> None:
    await send_booking_emails(booking)


async def send_booking_confirmed(booking: dict) -> None:
    """Notify admin when a booking is confirmed/payment received."""
    if not resend.api_key:
        print("[EMAIL] RESEND_API_KEY not set — skipping email")
        return
    if not ADMIN_EMAIL:
        print("[EMAIL] ADMIN_EMAIL not set — skipping confirmed notification")
        return
    service = SERVICE_LABELS.get(booking.get("service_type", ""), booking.get("service_type", "").replace("_", " ").title())
    try:
        r = resend.Emails.send({
            "from": SENDER,
            "to": [ADMIN_EMAIL],
            "subject": f"Booking Confirmed — {booking.get('name')} — {service}",
            "html": _admin_html(booking),
        })
        print(f"[EMAIL] Confirmed notification sent: {r}")
    except Exception as e:
        print(f"[EMAIL] Confirmed notification failed: {e}")


# ── Contact form ───────────────────────────────────────────────────────────────

async def send_contact_notification(name: str, email: str, message: str) -> None:
    if not resend.api_key:
        return
    if not ADMIN_EMAIL:
        print("[EMAIL] ADMIN_EMAIL not set — skipping contact notification")
        return
    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;
                max-width:620px;margin:0 auto;">
      <div style="background:#0ea5e9;padding:20px;color:#fff;">
        <h2 style="margin:0;font-size:18px;">CryoRevive &middot; New Contact Query</h2>
      </div>
      <div style="padding:20px;background:#fff;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;">{name}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#4B5563;">{email}</p>
        <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">{message}</p>
      </div>
    </div>"""
    try:
        r = resend.Emails.send({
            "from": SENDER,
            "to": [ADMIN_EMAIL],
            "subject": f"[CryoRevive] Contact query from {name}",
            "html": html,
            "reply_to": [email],
        })
        print(f"[EMAIL] Contact notification sent: {r}")
    except Exception as e:
        print(f"[EMAIL] Contact notification failed: {e}")
