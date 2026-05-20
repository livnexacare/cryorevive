import uuid
import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter

from database import db_execute
from models.contact import ContactIn
from utils.email import send_contact_notification

router = APIRouter(prefix="/api", tags=["contact"])


@router.post("/contact")
async def contact(payload: ContactIn):
    await db_execute(
        """INSERT INTO contacts (id, name, email, message, created_at)
           VALUES ($1,$2,$3,$4,$5)""",
        str(uuid.uuid4()), payload.name.strip(),
        str(payload.email), payload.message.strip(),
        datetime.now(timezone.utc)
    )
    asyncio.create_task(
        send_contact_notification(payload.name, str(payload.email), payload.message)
    )
    return {"message": "Thanks for reaching out! We'll get back to you within 24 hours."}
