import os
from urllib.parse import quote

WHATSAPP_NOTIFY_NUMBERS: list[str] = [
    n.strip()
    for n in os.getenv("WHATSAPP_NOTIFY_NUMBERS", "918595850920").split(",")
    if n.strip()
]


async def send_whatsapp_notifications(booking: dict) -> list[str]:
    """Log wa.me notify URLs for all admin numbers on each new booking."""
    service = booking.get("service_type", "").replace("_", " ").title()
    message = (
        f"🧊 *New CryoRevive Booking*\n\n"
        f"*Name:* {booking.get('name', '')}\n"
        f"*Service:* {service}\n"
        f"*Date:* {booking.get('date', '')}\n"
        f"*Time:* {booking.get('time_slot', '')}\n"
        f"*Phone:* {booking.get('phone', '')}\n\n"
        f"Confirm via WhatsApp to customer."
    )
    encoded = quote(message)
    for number in WHATSAPP_NOTIFY_NUMBERS:
        print(f"[WHATSAPP] Notify {number}: https://wa.me/{number}?text={encoded}")
    return WHATSAPP_NOTIFY_NUMBERS
