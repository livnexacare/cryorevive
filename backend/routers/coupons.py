import os
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException

from database import db_execute, db_fetch, db_fetchrow, row_to_dict, rows_to_list
from models.coupon import CouponIn, CouponUpdate, CouponValidateIn

router = APIRouter(prefix="/api", tags=["coupons"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/coupons")
async def list_coupons(x_admin_key: str = Header(default="")):
    _require_admin(x_admin_key)
    rows = await db_fetch("SELECT * FROM coupons ORDER BY created_at DESC")
    return rows_to_list(rows)


@router.post("/coupons", status_code=201)
async def create_coupon(data: CouponIn, x_admin_key: str = Header(default="")):
    _require_admin(x_admin_key)

    code = data.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Coupon code is required")

    existing = await db_fetchrow("SELECT id FROM coupons WHERE code = $1", code)
    if existing:
        raise HTTPException(status_code=409, detail="A coupon with this code already exists")

    row = await db_fetchrow(
        """INSERT INTO coupons
           (code, discount_type, discount_value, min_order_value,
            usage_limit, expires_at, description, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING *""",
        code, data.discount_type, data.discount_value, data.min_order_value,
        data.usage_limit, data.expires_at, data.description or "", data.is_active,
    )
    return row_to_dict(row)


@router.patch("/coupons/{coupon_id}")
async def update_coupon(
    coupon_id: str,
    data: CouponUpdate,
    x_admin_key: str = Header(default=""),
):
    _require_admin(x_admin_key)

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields = [f"{k} = ${i + 1}" for i, k in enumerate(update_data.keys())]
    values = list(update_data.values())
    values.append(coupon_id)

    await db_execute(
        f"UPDATE coupons SET {', '.join(fields)} WHERE id = ${len(values)}",
        *values,
    )
    row = await db_fetchrow("SELECT * FROM coupons WHERE id = $1", coupon_id)
    if not row:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return row_to_dict(row)


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, x_admin_key: str = Header(default="")):
    _require_admin(x_admin_key)
    await db_execute("DELETE FROM coupons WHERE id = $1", coupon_id)
    return {"status": "deleted"}


@router.post("/coupons/validate")
async def validate_coupon(payload: CouponValidateIn):
    code = payload.code.strip().upper()
    row = await db_fetchrow("SELECT * FROM coupons WHERE code = $1", code)
    if not row:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    coupon = row_to_dict(row)
    if not coupon["is_active"]:
        raise HTTPException(status_code=400, detail="This coupon is no longer active")
    if coupon["expires_at"] and coupon["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This coupon has expired")
    if coupon["usage_limit"] is not None and coupon["usage_count"] >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")
    if payload.order_value < coupon["min_order_value"]:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value for this coupon is ₹{coupon['min_order_value']:.0f}",
        )

    if coupon["discount_type"] == "percentage":
        discount_amount = round(payload.order_value * float(coupon["discount_value"]) / 100)
    else:
        discount_amount = min(float(coupon["discount_value"]), payload.order_value)

    return {
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": discount_amount,
        "final_amount": round(payload.order_value - discount_amount),
    }


@router.post("/coupons/redeem")
async def redeem_coupon(payload: CouponValidateIn):
    """Increment usage_count once a coupon-applied booking is actually sent —
    called fire-and-forget from the booking flow, separate from /validate
    (which runs on every keystroke and must not count as a redemption)."""
    code = payload.code.strip().upper()
    result = await db_execute(
        "UPDATE coupons SET usage_count = usage_count + 1 WHERE code = $1 AND is_active = true",
        code,
    )
    return {"redeemed": result == "UPDATE 1"}
