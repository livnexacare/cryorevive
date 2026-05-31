import asyncio
import os
from urllib.error import URLError
from urllib.parse import quote
from urllib.request import urlopen

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
