import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")

# Separate senders for each purpose
BOOKING_SENDER  = os.getenv("BOOKING_EMAIL_FROM",  "CryoRevive Bookings <booking@cryorevive.in>")
SUPPORT_SENDER  = os.getenv("SUPPORT_EMAIL_FROM",  "CryoRevive Support <support@cryorevive.in>")
ADMIN_EMAIL     = os.getenv("ADMIN_EMAIL",          "admin@livnexacare.com")
SUPPORT_EMAIL   = os.getenv("SUPPORT_DEST_EMAIL",   "support@cryorevive.in")

FALLBACK_SENDER = "CryoRevive <onboarding@resend.dev>"


def _get_booking_sender():
    return BOOKING_SENDER if "cryorevive.in" in BOOKING_SENDER else FALLBACK_SENDER


def _get_support_sender():
    return SUPPORT_SENDER if "cryorevive.in" in SUPPORT_SENDER else FALLBACK_SENDER


async def send_booking_received(booking: dict) -> None:
    """Booking confirmation to customer + notification to admin."""
    if not resend.api_key:
        print("[EMAIL] RESEND_API_KEY not set")
        return

    customer_email = booking.get("email", "")

    if "@whatsapp.booking" in customer_email:
        await _notify_admin_booking(booking)
        return

    try:
        r = resend.Emails.send({
            "from": _get_booking_sender(),
            "to": [customer_email],
            "reply_to": ["booking@cryorevive.in"],
            "subject": "Your CryoRevive Booking is Confirmed 🧊",
            "html": _customer_booking_html(booking),
        })
        print(f"[EMAIL] Booking confirmation sent to {customer_email}: {r}")
    except Exception as e:
        print(f"[EMAIL] Booking confirmation failed: {e}")

    await _notify_admin_booking(booking)


async def _notify_admin_booking(booking: dict) -> None:
    if not ADMIN_EMAIL:
        print("[EMAIL] ADMIN_EMAIL not set")
        return
    service = booking.get("service_type", "").replace("_", " ").title()
    try:
        r = resend.Emails.send({
            "from": _get_booking_sender(),
            "to": [ADMIN_EMAIL],
            "subject": f"🔔 New Booking — {booking.get('name')} — {service}",
            "html": _admin_booking_html(booking),
        })
        print(f"[EMAIL] Admin booking notification sent: {r}")
    except Exception as e:
        print(f"[EMAIL] Admin notification failed: {e}")


async def send_contact_notification(contact: dict) -> None:
    """Contact/support query — forward to support inbox + auto-reply to customer."""
    if not resend.api_key:
        print("[EMAIL] RESEND_API_KEY not set")
        return

    # 1. Forward query to support inbox
    try:
        r = resend.Emails.send({
            "from": _get_support_sender(),
            "to": [SUPPORT_EMAIL],
            "reply_to": [contact.get("email", "")],
            "subject": f"Support Query — {contact.get('name', 'Unknown')}",
            "html": _support_query_html(contact),
        })
        print(f"[EMAIL] Support query forwarded to {SUPPORT_EMAIL}: {r}")
    except Exception as e:
        print(f"[EMAIL] Support query forward failed: {e}")

    # 2. Auto-reply to customer
    customer_email = contact.get("email", "")
    if customer_email:
        try:
            r = resend.Emails.send({
                "from": _get_support_sender(),
                "to": [customer_email],
                "reply_to": ["support@cryorevive.in"],
                "subject": "We received your message — CryoRevive Support",
                "html": _support_autoreply_html(contact),
            })
            print(f"[EMAIL] Support auto-reply sent to {customer_email}: {r}")
        except Exception as e:
            print(f"[EMAIL] Support auto-reply failed: {e}")


async def send_booking_confirmed(booking: dict) -> None:
    """Payment confirmed — send final confirmation to customer."""
    if not resend.api_key:
        print("[EMAIL] RESEND_API_KEY not set")
        return
    customer_email = booking.get("email", "")
    if not customer_email or "@whatsapp.booking" in customer_email:
        return
    try:
        r = resend.Emails.send({
            "from": _get_booking_sender(),
            "to": [customer_email],
            "reply_to": ["booking@cryorevive.in"],
            "subject": "✅ Booking Confirmed — CryoRevive",
            "html": _payment_confirmed_html(booking),
        })
        print(f"[EMAIL] Payment confirmation sent: {r}")
    except Exception as e:
        print(f"[EMAIL] Payment confirmation failed: {e}")


async def test_email_config() -> dict:
    """Test both email senders are working."""
    results = {}

    if not ADMIN_EMAIL:
        return {"error": "ADMIN_EMAIL not set"}

    try:
        resend.Emails.send({
            "from": _get_booking_sender(),
            "to": [ADMIN_EMAIL],
            "subject": "✅ CryoRevive — Booking Email Test",
            "html": "<h2>Booking email is working!</h2><p>From: booking@cryorevive.in</p>",
        })
        results["booking_email"] = {"status": "sent", "from": _get_booking_sender()}
    except Exception as e:
        results["booking_email"] = {"status": "failed", "error": str(e)}

    try:
        resend.Emails.send({
            "from": _get_support_sender(),
            "to": [ADMIN_EMAIL],
            "subject": "✅ CryoRevive — Support Email Test",
            "html": "<h2>Support email is working!</h2><p>From: support@cryorevive.in</p>",
        })
        results["support_email"] = {"status": "sent", "from": _get_support_sender()}
    except Exception as e:
        results["support_email"] = {"status": "failed", "error": str(e)}

    return results


# ── HTML Templates ─────────────────────────────────────────────────────────────

def _customer_booking_html(b: dict) -> str:
    service = b.get("service_type", "").replace("_", " ").title()
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#0a0f1e;color:#ffffff;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#06b6d4;font-size:28px;margin:0;">CryoRevive</h1>
        <p style="color:#94a3b8;font-size:11px;letter-spacing:3px;
                  text-transform:uppercase;margin:4px 0 0;">
          Recover. Reset. Perform.
        </p>
      </div>
      <div style="background:#1e293b;border-radius:8px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#22d3ee;margin:0 0 16px;">&#9989; Booking Confirmed!</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:8px 0;font-size:14px;width:40%;">Service</td>
              <td style="color:#fff;font-weight:bold;font-size:14px;">{service}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;font-size:14px;">Date</td>
              <td style="color:#fff;font-weight:bold;font-size:14px;">{b.get('date', '')}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;font-size:14px;">Time</td>
              <td style="color:#fff;font-weight:bold;font-size:14px;">{b.get('time_slot', '')}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;font-size:14px;">Name</td>
              <td style="color:#fff;font-weight:bold;font-size:14px;">{b.get('name', '')}</td></tr>
          <tr><td style="color:#94a3b8;padding:8px 0;font-size:14px;">Payment</td>
              <td style="color:#fbbf24;font-weight:bold;font-size:14px;">Pay at venue</td></tr>
        </table>
      </div>
      <div style="background:#0f172a;border:1px solid #1e40af;border-radius:8px;
                  padding:16px;margin-bottom:20px;">
        <p style="color:#93c5fd;font-size:14px;margin:0;line-height:1.6;">
          &#128205; Please arrive 10 minutes before your session.<br>
          &#128241; We'll confirm your slot via WhatsApp shortly.<br>
          &#10067; Questions? Email us at <a href="mailto:support@cryorevive.in"
             style="color:#22d3ee;">support@cryorevive.in</a>
        </p>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
        CryoRevive &mdash; Recover Harder. Come Back Stronger.<br>
        <a href="https://cryorevive.in" style="color:#06b6d4;">cryorevive.in</a> |
        +91 09891430920
      </p>
    </div>"""


def _admin_booking_html(b: dict) -> str:
    service = b.get("service_type", "").replace("_", " ").title()
    rows_html = "".join(
        f"""<tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:12px 16px;color:#64748b;font-size:14px;">{k}</td>
          <td style="padding:12px 16px;font-weight:bold;font-size:14px;">{v}</td>
        </tr>"""
        for k, v in [
            ("Name",    b.get("name", "")),
            ("Email",   b.get("email", "")),
            ("Phone",   b.get("phone", "")),
            ("Service", service),
            ("Date",    b.get("date", "")),
            ("Time",    b.get("time_slot", "")),
            ("Notes",   b.get("notes", "—")),
        ]
    )
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#f8fafc;padding:32px;border-radius:12px;">
      <h2 style="color:#0f172a;margin:0 0 20px;">&#128276; New Booking &mdash; {b.get('name', '')}</h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;
                    border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr style="background:#0f172a;">
          <td style="color:#94a3b8;padding:12px 16px;font-size:13px;width:35%;">Field</td>
          <td style="color:#fff;padding:12px 16px;font-size:13px;">Value</td>
        </tr>
        {rows_html}
      </table>
      <div style="margin-top:20px;padding:16px;background:#fef3c7;
                  border-radius:8px;border-left:4px solid #f59e0b;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          &#9889; Confirm this booking via WhatsApp to the customer.
        </p>
      </div>
    </div>"""


def _support_query_html(c: dict) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#f8fafc;padding:32px;border-radius:12px;">
      <h2 style="color:#0f172a;margin:0 0 20px;">
        &#128172; Support Query &mdash; {c.get('name', '')}
      </h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;
                    border-radius:8px;border:1px solid #e2e8f0;">
        <tr><td style="padding:12px 16px;color:#64748b;font-size:14px;width:30%;">Name</td>
            <td style="padding:12px 16px;font-weight:bold;">{c.get('name', '')}</td></tr>
        <tr style="background:#f8fafc;">
            <td style="padding:12px 16px;color:#64748b;font-size:14px;">Email</td>
            <td style="padding:12px 16px;">{c.get('email', '')}</td></tr>
        <tr><td style="padding:12px 16px;color:#64748b;font-size:14px;">Message</td>
            <td style="padding:12px 16px;white-space:pre-wrap;">{c.get('message', '')}</td></tr>
      </table>
      <p style="margin-top:16px;color:#64748b;font-size:13px;">
        Reply directly to this email to respond to the customer.
      </p>
    </div>"""


def _support_autoreply_html(c: dict) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#0a0f1e;color:#ffffff;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#06b6d4;font-size:28px;margin:0;">CryoRevive</h1>
        <p style="color:#94a3b8;font-size:11px;letter-spacing:3px;
                  text-transform:uppercase;margin:4px 0;">Support</p>
      </div>
      <div style="background:#1e293b;border-radius:8px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#22d3ee;margin:0 0 12px;">We received your message!</h2>
        <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;">
          Hi {c.get('name', 'there')},<br><br>
          Thank you for reaching out to CryoRevive. We have received your
          query and our support team will get back to you within
          <strong style="color:#fff;">24 hours</strong>.<br><br>
          Your message:<br>
          <em style="color:#94a3b8;">"{c.get('message', '')}"</em>
        </p>
      </div>
      <div style="background:#0f172a;border:1px solid #1e40af;border-radius:8px;
                  padding:16px;margin-bottom:20px;">
        <p style="color:#93c5fd;font-size:14px;margin:0;line-height:1.6;">
          &#128241; For urgent queries WhatsApp us at +91 09891430920<br>
          &#127760; Visit us at
          <a href="https://cryorevive.in" style="color:#22d3ee;">cryorevive.in</a>
        </p>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
        CryoRevive Support &mdash;
        <a href="mailto:support@cryorevive.in" style="color:#06b6d4;">support@cryorevive.in</a>
      </p>
    </div>"""


def _payment_confirmed_html(b: dict) -> str:
    service = b.get("service_type", "").replace("_", " ").title()
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                background:#0a0f1e;color:#ffffff;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#06b6d4;font-size:28px;margin:0;">CryoRevive</h1>
      </div>
      <div style="background:#14532d;border-radius:8px;padding:24px;margin-bottom:20px;">
        <h2 style="color:#4ade80;margin:0 0 8px;">&#9989; Payment Confirmed!</h2>
        <p style="color:#bbf7d0;font-size:14px;margin:0;">
          Your {service} session is fully confirmed.
        </p>
      </div>
      <div style="background:#1e293b;border-radius:8px;padding:20px;">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Date</p>
        <p style="color:#fff;font-weight:bold;margin:0 0 12px;">{b.get('date', '')}</p>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Time</p>
        <p style="color:#fff;font-weight:bold;margin:0;">{b.get('time_slot', '')}</p>
      </div>
    </div>"""
