import os
import hmac
import hashlib
import asyncio
import logging

import razorpay
from fastapi import APIRouter, HTTPException, Request

from database import db_execute, db_fetchrow, row_to_dict
from models.payment import PaymentInitIn
from utils.email import send_booking_confirmed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

RAZORPAY_KEY_ID      = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET  = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")


def _rz_client():
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@router.post("/initiate")
async def initiate_payment(payload: PaymentInitIn):
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    booking = row_to_dict(await db_fetchrow(
        "SELECT * FROM bookings WHERE booking_id = $1", payload.booking_id
    ))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] == "confirmed":
        raise HTTPException(status_code=400, detail="Booking is already confirmed")

    amount_paise = int(payload.amount * 100)   # Razorpay uses smallest currency unit
    try:
        order = _rz_client().order.create({
            "amount": amount_paise,
            "currency": payload.currency,
            "receipt": payload.booking_id,
            "notes": {
                "booking_id": payload.booking_id,
                "customer_name": booking.get("name", ""),
                "service": booking.get("service_type", ""),
            },
        })
    except Exception as e:
        logger.error("Razorpay order creation failed: %s", e)
        raise HTTPException(status_code=502, detail="Could not create payment order")

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

    if RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json as _json
    try:
        event = _json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event")
    if event_type != "payment.captured":
        return {"ok": True, "skipped": event_type}

    payload = event.get("payload", {})
    payment = payload.get("payment", {}).get("entity", {})
    order_id = payment.get("order_id")
    payment_id = payment.get("id")

    if not order_id:
        return {"ok": True}

    # Look up the booking by razorpay order id stored in payments table
    payment_row = row_to_dict(await db_fetchrow(
        "SELECT * FROM payments WHERE razorpay_order_id = $1", order_id
    ))
    if not payment_row:
        logger.warning("Webhook: no payment row found for order %s", order_id)
        return {"ok": True}

    booking_id = payment_row["booking_id"]
    await db_execute(
        "UPDATE payments SET razorpay_payment_id = $1, status = 'captured' WHERE razorpay_order_id = $2",
        payment_id, order_id
    )
    await db_execute(
        "UPDATE bookings SET status = 'confirmed' WHERE booking_id = $1", booking_id
    )
    booking = row_to_dict(await db_fetchrow(
        "SELECT * FROM bookings WHERE booking_id = $1", booking_id
    ))
    if booking:
        asyncio.create_task(send_booking_confirmed(booking))

    return {"ok": True}
