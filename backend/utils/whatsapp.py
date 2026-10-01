import asyncio
import os
from urllib.error import URLError
from urllib.parse import quote
from urllib.request import urlopen

import httpx

# Format: "918595850920:apikey1,91XXXXXXXXXX:apikey2"
# Each number must register its own key at callmebot.com (see .env.example)
_raw = os.getenv("WHATSAPP_NOTIFY_NUMBERS", "")
WHATSAPP_NOTIFY_NUMBERS: list[tuple[str, str]] = []
for _entry in _raw.split(","):
    _entry = _entry.strip()
    if not _entry:
        continue
    if ":" in _entry:
        _num, _key = _entry.split(":", 1)
        WHATSAPP_NOTIFY_NUMBERS.append((_num.strip(), _key.strip()))
    else:
        WHATSAPP_NOTIFY_NUMBERS.append((_entry, ""))


def _callmebot_send(number: str, apikey: str, text: str) -> None:
    """Blocking HTTP GET to CallMeBot — run via run_in_executor."""
    url = (
        f"https://api.callmebot.com/whatsapp.php"
        f"?phone={number}&text={quote(text)}&apikey={apikey}"
    )
    try:
        with urlopen(url, timeout=15) as resp:
            body = resp.read().decode(errors="replace")
            print(f"[WHATSAPP] {number}: HTTP {resp.status} — {body[:120]}")
    except URLError as exc:
        print(f"[WHATSAPP] {number}: request failed — {exc}")


async def send_whatsapp_notifications(booking: dict) -> list[str]:
    """Send booking alert to every number in WHATSAPP_NOTIFY_NUMBERS via CallMeBot."""
    if not WHATSAPP_NOTIFY_NUMBERS:
        print("[WHATSAPP] WHATSAPP_NOTIFY_NUMBERS not set — skipping")
        return []

    service = booking.get("service_type", "").replace("_", " ").title()
    message = (
        f"New CryoRevive Booking\n\n"
        f"Name: {booking.get('name', '')}\n"
        f"Service: {service}\n"
        f"Date: {booking.get('date', '')}\n"
        f"Time: {booking.get('time_slot', '')}\n"
        f"Phone: {booking.get('phone', '')}\n\n"
        f"Confirm via WhatsApp to customer."
    )

    loop = asyncio.get_event_loop()
    notified: list[str] = []
    for number, apikey in WHATSAPP_NOTIFY_NUMBERS:
        if not apikey:
            print(
                f"[WHATSAPP] {number}: no apikey — skipping. "
                f"Register at callmebot.com to get one."
            )
            continue
        await loop.run_in_executor(None, _callmebot_send, number, apikey, message)
        notified.append(number)

    return notified


# ── Meta WhatsApp Business (Cloud) API — used by routers/automation.py for ──
# ── customer-facing invoice delivery and membership reminders. Separate   ──
# ── from the CallMeBot admin-alert helpers above, which keep working as   ──
# ── before (different account, different purpose).                       ──
WHATSAPP_API_URL = "https://graph.facebook.com/v19.0"
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")


def _normalize_phone(to_phone: str) -> str:
    """Format for the Cloud API: 91XXXXXXXXXX — no +, no spaces, no leading 0."""
    phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "91" + phone[1:]
    if len(phone) == 10:
        phone = "91" + phone
    return phone


async def send_whatsapp_template(
    to_phone: str,
    template_name: str,
    parameters: list[dict],
    language: str = "en",
) -> dict:
    """Send a pre-approved WhatsApp template message via the Meta Cloud API."""
    if not PHONE_NUMBER_ID or not WHATSAPP_TOKEN:
        print("[WHATSAPP] WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set — skipping")
        return {"error": "WhatsApp Business API not configured"}

    payload = {
        "messaging_product": "whatsapp",
        "to": _normalize_phone(to_phone),
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": [{"type": "body", "parameters": parameters}],
        },
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/messages",
            json=payload,
            headers={
                "Authorization": f"Bearer {WHATSAPP_TOKEN}",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        return res.json()


async def send_whatsapp_text(to_phone: str, message: str) -> dict:
    """Send free-form text via the Meta Cloud API (only within the 24hr
    customer-service window — i.e. the customer messaged us recently)."""
    if not PHONE_NUMBER_ID or not WHATSAPP_TOKEN:
        print("[WHATSAPP] WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set — skipping")
        return {"error": "WhatsApp Business API not configured"}

    payload = {
        "messaging_product": "whatsapp",
        "to": _normalize_phone(to_phone),
        "type": "text",
        "text": {"body": message},
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{WHATSAPP_API_URL}/{PHONE_NUMBER_ID}/messages",
            json=payload,
            headers={
                "Authorization": f"Bearer {WHATSAPP_TOKEN}",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        return res.json()
