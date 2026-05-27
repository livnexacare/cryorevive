import os
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from database import db_fetch, db_execute, db_fetchrow, rows_to_list, row_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pricing"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(key: str) -> None:
    if not ADMIN_KEY or key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


# ── Service Pricing ───────────────────────────────────────────────────────────

class ServicePriceUpdate(BaseModel):
    price: Optional[int] = None
    duration: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/pricing/services")
async def get_service_pricing():
    rows = await db_fetch("SELECT * FROM service_pricing ORDER BY name ASC")
    return rows_to_list(rows)


@router.patch("/pricing/services/{service_type}")
async def update_service_price(
    service_type: str,
    data: ServicePriceUpdate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    fields = ["updated_at = NOW()"]
    values = []
    idx = 1

    if data.price is not None:
        fields.append(f"price = ${idx}")
        values.append(data.price)
        idx += 1
    if data.duration is not None:
        fields.append(f"duration = ${idx}")
        values.append(data.duration)
        idx += 1
    if data.is_active is not None:
        fields.append(f"is_active = ${idx}")
        values.append(data.is_active)
        idx += 1

    values.append(service_type)
    await db_execute(
        f"UPDATE service_pricing SET {', '.join(fields)} WHERE service_type = ${idx}",
        *values,
    )
    row = await db_fetchrow(
        "SELECT * FROM service_pricing WHERE service_type = $1", service_type
    )
    if not row:
        raise HTTPException(status_code=404, detail="Service not found")
    return row_to_dict(row)


# ── Event Pricing ─────────────────────────────────────────────────────────────

class EventPricingCreate(BaseModel):
    name: str
    event_type: str
    min_athletes: int
    max_athletes: int
    base_price: int
    price_per_athlete: int
    gst_percent: float = 18.0
    description: Optional[str] = None
    is_active: bool = True


class EventPricingUpdate(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    min_athletes: Optional[int] = None
    max_athletes: Optional[int] = None
    base_price: Optional[int] = None
    price_per_athlete: Optional[int] = None
    gst_percent: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/pricing/events")
async def get_event_pricing():
    rows = await db_fetch(
        "SELECT * FROM event_pricing ORDER BY min_athletes ASC"
    )
    return rows_to_list(rows)


@router.post("/pricing/events", status_code=201)
async def create_event_pricing(
    data: EventPricingCreate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    row = await db_fetchrow(
        """INSERT INTO event_pricing
           (name, event_type, min_athletes, max_athletes, base_price,
            price_per_athlete, gst_percent, description, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING *""",
        data.name, data.event_type, data.min_athletes, data.max_athletes,
        data.base_price, data.price_per_athlete, data.gst_percent,
        data.description, data.is_active,
    )
    return row_to_dict(row)


@router.patch("/pricing/events/{event_id}")
async def update_event_pricing(
    event_id: str,
    data: EventPricingUpdate,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields = [f"{k} = ${i + 1}" for i, k in enumerate(update_data.keys())]
    fields.append(f"updated_at = NOW()")
    values = list(update_data.values())
    values.append(event_id)

    await db_execute(
        f"UPDATE event_pricing SET {', '.join(fields)} WHERE id = ${len(values)}",
        *values,
    )
    row = await db_fetchrow("SELECT * FROM event_pricing WHERE id = $1", event_id)
    if not row:
        raise HTTPException(status_code=404, detail="Event pricing not found")
    return row_to_dict(row)


@router.delete("/pricing/events/{event_id}")
async def delete_event_pricing(
    event_id: str,
    x_admin_key: str = Header("", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    await db_execute("DELETE FROM event_pricing WHERE id = $1", event_id)
    return {"status": "deleted"}
