"""Resend email delivery for customer-facing automation: GST invoices and
membership reminders. Separate from utils/email.py, which handles booking
confirmation + contact-form emails on different Resend senders.
"""

import os
from typing import Optional

import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = os.getenv("BOOKING_EMAIL_FROM", "CryoRevive <booking@cryorevive.in>")
SUPPORT_EMAIL = os.getenv("SUPPORT_DEST_EMAIL", "info@cryorevive.in")

# Resend rejects sends from an unverified domain. If cryorevive.in hasn't
# been verified for this environment (BOOKING_EMAIL_FROM left at its
# placeholder), fall back to Resend's sandbox sender instead of failing.
_FALLBACK_SENDER = "CryoRevive <onboarding@resend.dev>"


def _sender() -> str:
    return FROM_EMAIL if "cryorevive.in" in FROM_EMAIL else _FALLBACK_SENDER


def send_invoice_email(
    to_email: str,
    client_name: str,
    invoice_number: str,
    service_name: str,
    amount: int,
    date: str,
    pdf_base64: Optional[str] = None,
) -> dict:
    """Send invoice email with PDF attachment via Resend"""

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 0 auto; background: white; }}
    .header {{ background: #0f172a; padding: 30px; text-align: center; }}
    .header h1 {{ color: white; margin: 0; font-size: 24px; }}
    .header span {{ color: #06b6d4; }}
    .body {{ padding: 30px; }}
    .invoice-box {{ background: #f0f9ff; border: 1px solid #bae6fd;
                    border-radius: 8px; padding: 20px; margin: 20px 0; }}
    .row {{ display: flex; justify-content: space-between;
            padding: 6px 0; border-bottom: 1px solid #e2e8f0; }}
    .label {{ color: #64748b; font-size: 14px; }}
    .value {{ font-weight: bold; color: #0f172a; font-size: 14px; }}
    .total-row {{ background: #06b6d4; color: white; padding: 12px 20px;
                  border-radius: 6px; display: flex;
                  justify-content: space-between; margin-top: 10px; }}
    .footer {{ background: #f8fafc; padding: 20px; text-align: center;
               color: #94a3b8; font-size: 12px; }}
    .btn {{ display: inline-block; background: #06b6d4; color: white;
            padding: 12px 24px; border-radius: 8px; text-decoration: none;
            font-weight: bold; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cryo<span>Revive</span></h1>
      <p style="color:#94a3b8; margin:4px 0 0 0; font-size:13px;">
        RECOVERY AND WELLNESS CENTRE
      </p>
    </div>

    <div class="body">
      <p style="color:#0f172a; font-size:16px;">
        Dear <strong>{client_name}</strong>,
      </p>
      <p style="color:#64748b;">
        Thank you for visiting CryoRevive! Please find your invoice below.
      </p>

      <div class="invoice-box">
        <p style="font-weight:bold; color:#0f172a; margin:0 0 12px 0;">
          TAX INVOICE — {invoice_number}
        </p>
        <div class="row">
          <span class="label">Service</span>
          <span class="value">{service_name}</span>
        </div>
        <div class="row">
          <span class="label">Date</span>
          <span class="value">{date}</span>
        </div>
        <div class="row">
          <span class="label">Place of Supply</span>
          <span class="value">09 - Uttar Pradesh</span>
        </div>
        <div class="row">
          <span class="label">Taxable Value</span>
          <span class="value">₹{int(amount / 1.18):,}</span>
        </div>
        <div class="row">
          <span class="label">CGST @ 9%</span>
          <span class="value">₹{int((amount - amount / 1.18) / 2):,}</span>
        </div>
        <div class="row">
          <span class="label">SGST @ 9%</span>
          <span class="value">₹{int((amount - amount / 1.18) / 2):,}</span>
        </div>
        <div class="total-row">
          <span>Total Amount</span>
          <span>₹{amount:,}</span>
        </div>
      </div>

      <p style="color:#64748b; font-size:13px;">
        Livnexa Care Pvt. Ltd. | GSTIN: 09AAGCL7757C1Z9<br>
        C-168, Omnicron 1, Mathurapur, Greater Noida - 201310
      </p>

      <a href="https://www.cryorevive.in" class="btn">
        Book Next Session →
      </a>
    </div>

    <div class="footer">
      <p>📍 C-168, Omnicron 1, Mathurapur, Greater Noida</p>
      <p>📞 +91 8595850920 | 🌐 www.cryorevive.in</p>
      <p>Follow us @cryo.revive.in on Instagram</p>
      <p style="margin-top:12px; font-size:11px;">
        RECOVER • RESET • PERFORM
      </p>
    </div>
  </div>
</body>
</html>
"""

    params = {
        "from": _sender(),
        "to": [to_email],
        "subject": f"Your CryoRevive Invoice — {invoice_number}",
        "html": html_body,
        "reply_to": SUPPORT_EMAIL,
    }

    # Attach PDF if provided
    if pdf_base64:
        params["attachments"] = [{
            "filename": f"CryoRevive-Invoice-{invoice_number.replace('/', '-')}.pdf",
            "content": pdf_base64,
        }]

    return resend.Emails.send(params)


def send_membership_reminder_email(
    to_email: str,
    client_name: str,
    sessions_remaining: int,
    days_left: int,
    package_name: str,
) -> dict:
    """Send membership session reminder email"""

    urgency_color = "#ef4444" if sessions_remaining <= 2 else "#f59e0b" if sessions_remaining <= 4 else "#06b6d4"

    low_sessions_banner = (
        "<p style='background:#fef2f2; border:1px solid #fecaca; border-radius:8px; "
        "padding:12px; color:#dc2626;'>⚠️ <strong>Only " + str(sessions_remaining) +
        " sessions left!</strong> Book soon before they expire.</p>"
        if sessions_remaining <= 3 else ""
    )
    expiry_banner = (
        "<p style='background:#fef3c7; border:1px solid #fde68a; border-radius:8px; "
        "padding:12px; color:#92400e;'>⏰ Your membership expires in <strong>" +
        str(days_left) + " days</strong>. Don't miss your sessions!</p>"
        if days_left <= 7 else ""
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Arial, sans-serif; background: #f8fafc; }}
    .container {{ max-width: 600px; margin: 0 auto; background: white; }}
    .header {{ background: #0f172a; padding: 30px; text-align: center; }}
    .stats {{ display: flex; gap: 12px; margin: 20px 0; }}
    .stat {{ flex: 1; background: #f8fafc; border-radius: 8px;
             padding: 16px; text-align: center; border: 1px solid #e2e8f0; }}
    .stat-num {{ font-size: 32px; font-weight: 900; }}
    .stat-label {{ color: #64748b; font-size: 12px; }}
    .btn {{ display: inline-block; background: #06b6d4; color: white;
            padding: 12px 24px; border-radius: 8px; text-decoration: none;
            font-weight: bold; }}
    .footer {{ background: #f8fafc; padding: 20px; text-align: center;
               color: #94a3b8; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color:white; margin:0;">Cryo<span style="color:#06b6d4;">Revive</span></h1>
      <p style="color:#94a3b8; margin:4px 0 0 0;">Your Weekly Recovery Reminder</p>
    </div>

    <div style="padding: 30px;">
      <p style="color:#0f172a; font-size:16px;">
        Hi <strong>{client_name}</strong> 👋
      </p>
      <p style="color:#64748b;">
        Here's your <strong>{package_name}</strong> membership update:
      </p>

      <div class="stats">
        <div class="stat">
          <div class="stat-num" style="color:{urgency_color};">
            {sessions_remaining}
          </div>
          <div class="stat-label">Sessions Remaining</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color:#f59e0b;">{days_left}</div>
          <div class="stat-label">Days Until Expiry</div>
        </div>
      </div>

      {low_sessions_banner}

      {expiry_banner}

      <p style="color:#64748b;">
        Ready to recover? Book your next session now.
      </p>

      <a href="https://wa.me/918595850920?text=Hi!+I+want+to+book+my+next+recovery+session."
         class="btn">
        Book Your Session →
      </a>
    </div>

    <div class="footer">
      <p>📍 C-168, Omnicron 1, Mathurapur, Greater Noida</p>
      <p>📞 +91 8595850920</p>
      <p>RECOVER • RESET • PERFORM</p>
    </div>
  </div>
</body>
</html>
"""

    subject = (
        f"⚠️ Only {sessions_remaining} sessions left — CryoRevive"
        if sessions_remaining <= 3
        else f"📅 Your CryoRevive {package_name} — Weekly Update"
    )

    return resend.Emails.send({
        "from": _sender(),
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    })
