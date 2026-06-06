import os
import uuid
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, UploadFile, File
from pydantic import BaseModel
from pywebpush import webpush, WebPushException

from database import db_execute, db_fetch, db_fetchrow, row_to_dict, rows_to_list

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["notifications"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@cryorevive.in")

VALID_TYPES = {"general", "offer", "feature", "event"}


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


async def _send_push_to_all(title: str, body: str, url: str) -> dict:
    if not VAPID_PRIVATE_KEY:
        logger.warning("VAPID_PRIVATE_KEY not set — skipping push")
        return {"pushed": 0, "removed_stale": 0}

    subs = rows_to_list(
        await db_fetch("SELECT endpoint, p256dh, auth FROM push_subscriptions")
    )
    message = json.dumps({"title": title, "body": body, "url": url})
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

    for endpoint in stale:
        await db_execute(
            "DELETE FROM push_subscriptions WHERE endpoint = $1", endpoint
        )

    return {"pushed": pushed, "removed_stale": len(stale)}


# ── Models ────────────────────────────────────────────────────────────────────

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
    type: str = "general"
    url: Optional[str] = "/"
    expires_at: Optional[datetime] = None
    image_url: Optional[str] = None
    cta_label: Optional[str] = None
    cta_url: Optional[str] = None
    cta_type: Optional[str] = "link"  # whatsapp | link | booking | phone


class SendPushIn(BaseModel):
    announcement_id: str


class DeactivateIn(BaseModel):
    active: bool
    image_url: Optional[str] = None
    cta_label: Optional[str] = None
    cta_url: Optional[str] = None
    cta_type: Optional[str] = None


# ── Subscribe ─────────────────────────────────────────────────────────────────

@router.post("/notifications/subscribe", status_code=201)
async def subscribe(sub: PushSubscription):
    existing = await db_fetchrow(
        "SELECT id FROM push_subscriptions WHERE endpoint = $1", sub.endpoint
    )
    if not existing:
        await db_execute(
            "INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES ($1, $2, $3)",
            sub.endpoint, sub.keys.p256dh, sub.keys.auth,
        )
    return {"ok": True}


# ── Announcements — public read (active only) ─────────────────────────────────

@router.get("/notifications/announcements")
async def list_announcements():
    rows = await db_fetch(
        """SELECT id, title, body, type, url, expires_at, active, created_at
           FROM announcements
           WHERE active = true
           ORDER BY created_at DESC
           LIMIT 50"""
    )
    return rows_to_list(rows)


# ── Admin: create announcement (save only) ────────────────────────────────────

@router.post("/notifications/announcements", status_code=201)
async def create_announcement(
    payload: AnnouncementIn,
    x_admin_key: str = Header(""),
):
    _require_admin(x_admin_key)
    ann_type = payload.type if payload.type in VALID_TYPES else "general"
    row = await db_fetchrow(
        """INSERT INTO announcements
               (title, body, type, url, expires_at, image_url, cta_label, cta_url, cta_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, title, body, type, url, expires_at, active,
                     image_url, cta_label, cta_url, cta_type, created_at""",
        payload.title, payload.body, ann_type,
        payload.url or "/", payload.expires_at,
        payload.image_url, payload.cta_label, payload.cta_url, payload.cta_type or "link",
    )
    return row_to_dict(row)


@router.post("/notifications/announcements/upload-image")
async def upload_announcement_image(
    file: UploadFile = File(...),
    x_admin_key: str = Header(""),
):
    _require_admin(x_admin_key)
    from utils.r2_upload import upload_to_r2
    contents = await file.read()
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin").lower()
    path = f"announcements/{uuid.uuid4().hex}.{ext}"
    url = upload_to_r2(contents, path, file.content_type or "image/jpeg")
    return {"url": url, "filename": path}


# ── Admin: send push for an existing announcement ─────────────────────────────

@router.post("/notifications/send")
async def send_push(
    payload: SendPushIn,
    x_admin_key: str = Header(""),
):
    _require_admin(x_admin_key)
    ann = await db_fetchrow(
        "SELECT title, body, url FROM announcements WHERE id = $1",
        payload.announcement_id,
    )
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    result = await _send_push_to_all(ann["title"], ann["body"], ann["url"])
    return {"ok": True, **result}


# ── Admin: deactivate announcement ────────────────────────────────────────────

@router.patch("/notifications/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    payload: DeactivateIn,
    x_admin_key: str = Header(""),
):
    _require_admin(x_admin_key)
    existing = await db_fetchrow(
        "SELECT id FROM announcements WHERE id = $1", announcement_id
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")
    await db_execute(
        """UPDATE announcements
           SET active = $1,
               image_url = COALESCE($2, image_url),
               cta_label = COALESCE($3, cta_label),
               cta_url   = COALESCE($4, cta_url),
               cta_type  = COALESCE($5, cta_type)
           WHERE id = $6""",
        payload.active, payload.image_url, payload.cta_label,
        payload.cta_url, payload.cta_type, announcement_id,
    )
    return {"ok": True}
