import os
import json
import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from pywebpush import webpush, WebPushException

from database import db_execute, db_fetch, db_fetchrow, rows_to_list

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["notifications"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.environ.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@cryorevive.in")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscription(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    expirationTime: Optional[float] = None


class AnnouncementIn(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/"


# ── Subscribe ────────────────────────────────────────────────────────────────

@router.post("/notifications/subscribe", status_code=201)
async def subscribe(sub: PushSubscription):
    existing = await db_fetchrow(
        "SELECT id FROM push_subscriptions WHERE endpoint = $1",
        sub.endpoint,
    )
    if not existing:
        await db_execute(
            """INSERT INTO push_subscriptions (endpoint, p256dh, auth)
               VALUES ($1, $2, $3)""",
            sub.endpoint,
            sub.keys.p256dh,
            sub.keys.auth,
        )
    return {"ok": True}


# ── Announcements (public read) ───────────────────────────────────────────────

@router.get("/notifications/announcements")
async def list_announcements():
    rows = await db_fetch(
        "SELECT id, title, body, url, created_at FROM announcements ORDER BY created_at DESC LIMIT 20"
    )
    return rows_to_list(rows)


# ── Admin: create announcement + push ────────────────────────────────────────

@router.post("/notifications/announce", status_code=201)
async def create_announcement(
    payload: AnnouncementIn,
    x_admin_key: str = Header(""),
):
    _require_admin(x_admin_key)

    await db_execute(
        "INSERT INTO announcements (title, body, url) VALUES ($1, $2, $3)",
        payload.title,
        payload.body,
        payload.url,
    )

    if not VAPID_PRIVATE_KEY:
        logger.warning("VAPID_PRIVATE_KEY not set — skipping push")
        return {"ok": True, "pushed": 0}

    subs = rows_to_list(
        await db_fetch("SELECT endpoint, p256dh, auth FROM push_subscriptions")
    )

    message = json.dumps({"title": payload.title, "body": payload.body, "url": payload.url})
    vapid_claims = {"sub": f"mailto:{ADMIN_EMAIL}"}

    pushed = 0
    stale: list[str] = []

    for s in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": s["endpoint"],
                    "keys": {"p256dh": s["p256dh"], "auth": s["auth"]},
                },
                data=message,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=vapid_claims,
            )
            pushed += 1
        except WebPushException as e:
            status = getattr(e.response, "status_code", None) if e.response else None
            if status in (404, 410):
                stale.append(s["endpoint"])
            else:
                logger.error("Push failed for %s: %s", s["endpoint"], e)

    if stale:
        for endpoint in stale:
            await db_execute(
                "DELETE FROM push_subscriptions WHERE endpoint = $1", endpoint
            )

    return {"ok": True, "pushed": pushed, "removed_stale": len(stale)}
