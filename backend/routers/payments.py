import os
import hmac
import json
import hashlib
import asyncio
import logging

import razorpay
from fastapi import APIRouter, HTTPException, Request

from database import db_execute, db_fetchrow, row_to_dict
from models.payment import PaymentInitIn
from utils.email import send_booking_confirmed

logger = logging.getLogger(__name__)
print = logger.info   # route print() through logger so Render captures it

router = APIRouter(prefix="/api/payments", tags=["payments"])

RAZORPAY_KEY_ID         = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET     = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")


def _rz_client() -> razorpay.Client:
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@router.post("/initiate")
async def initiate_payment(payload: PaymentInitIn):
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    booking = row_to_dict(await db_fetchrow(
        "SELECT * FROM bookings WHERE id = $1", payload.booking_id
    ))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Booking is already paid")

    amount_paise = int(payload.amount * 100)
    try:
        order = _rz_client().order.create({
            "amount": amount_paise,
            "currency": payload.currency,
            "receipt": payload.booking_id[:40],   # Razorpay max 40 chars
            "notes": {
                "booking_id": payload.booking_id,
                "customer_name": booking.get("name", ""),
                "service": booking.get("service_type", ""),
            },
        })
    except Exception as e:
        print(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=502, detail="Could not create payment order")

    # Store the Razorpay order id on the booking so the webhook can find it
    try:
        await db_execute(
            "UPDATE bookings SET razorpay_order_id = $1 WHERE id = $2",
            order["id"], payload.booking_id
        )
    except Exception as e:
        print(f"Failed to store razorpay_order_id: {e}")

    return {
        "razorpay_order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": RAZORPAY_KEY_ID,
        "booking_id": payload.booking_id,
    }


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Verify HMAC signature when secret is configured
    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event")
    if event_type != "payment.captured":
        return {"ok": True, "skipped": event_type}

    entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id  = entity.get("order_id")
    payment_id = entity.get("id")

    if not order_id:
        return {"ok": True}

    # Find the booking by its stored razorpay_order_id
    booking = row_to_dict(await db_fetchrow(
        "SELECT * FROM bookings WHERE razorpay_order_id = $1", order_id
    ))
    if not booking:
        print(f"Webhook: no booking found for Razorpay order {order_id}")
        return {"ok": True}

    try:
        await db_execute(
            """UPDATE bookings
               SET razorpay_payment_id = $1, payment_status = 'paid', status = 'confirmed'
               WHERE razorpay_order_id = $2""",
            payment_id, order_id
        )
    except Exception as e:
        print(f"Webhook DB update failed: {e}")
        raise HTTPException(status_code=500, detail="DB update failed")

    updated = row_to_dict(await db_fetchrow(
        "SELECT * FROM bookings WHERE razorpay_order_id = $1", order_id
    ))
    if updated:
        asyncio.create_task(send_booking_confirmed(updated))

    return {"ok": True}
