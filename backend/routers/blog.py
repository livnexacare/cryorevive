import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header

from database import db_execute, db_fetchrow, db_fetch, row_to_dict, rows_to_list
from models.blog import BlogPostIn, BlogPostUpdate

router = APIRouter(prefix="/api/blog", tags=["blog"])

ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "")


def require_admin(x_admin_key: Optional[str] = Header(default=None)):
    if not ADMIN_API_KEY or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing admin key")


@router.get("")
async def list_posts():
    rows = rows_to_list(await db_fetch(
        "SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC"
    ))
    return rows


@router.get("/{slug}")
async def get_post(slug: str):
    row = row_to_dict(await db_fetchrow(
        "SELECT * FROM blog_posts WHERE slug = $1 AND published = true", slug
    ))
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    return row


@router.post("", status_code=201)
async def create_post(payload: BlogPostIn, x_admin_key: Optional[str] = Header(default=None)):
    require_admin(x_admin_key)
    if await db_fetchrow("SELECT id FROM blog_posts WHERE slug = $1", payload.slug):
        raise HTTPException(status_code=409, detail="A post with this slug already exists")
    now = datetime.now(timezone.utc)
    try:
        await db_execute(
            """INSERT INTO blog_posts
               (id, title, slug, content, excerpt, cover_image_url, published, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)""",
            str(uuid.uuid4()), payload.title, payload.slug, payload.content,
            payload.excerpt, payload.cover_image_url, payload.published, now
        )
    except Exception as e:
        print(f"ERROR create_post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")
    return row_to_dict(await db_fetchrow("SELECT * FROM blog_posts WHERE slug = $1", payload.slug))


@router.put("/{slug}")
async def update_post(slug: str, payload: BlogPostUpdate, x_admin_key: Optional[str] = Header(default=None)):
    require_admin(x_admin_key)
    existing = row_to_dict(await db_fetchrow("SELECT * FROM blog_posts WHERE slug = $1", slug))
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        return existing

    fields = []
    values = []
    for i, (key, val) in enumerate(updates.items(), start=1):
        fields.append(f"{key} = ${i}")
        values.append(val)

    values.append(datetime.now(timezone.utc))
    fields.append(f"updated_at = ${len(values)}")
    values.append(slug)

    try:
        await db_execute(
            f"UPDATE blog_posts SET {', '.join(fields)} WHERE slug = ${len(values)}",
            *values
        )
    except Exception as e:
        print(f"ERROR update_post: {e}")
        raise HTTPException(status_code=500, detail="Failed to update post")
    return row_to_dict(await db_fetchrow("SELECT * FROM blog_posts WHERE slug = $1", slug))


@router.delete("/{slug}")
async def delete_post(slug: str, x_admin_key: Optional[str] = Header(default=None)):
    require_admin(x_admin_key)
    res = await db_execute("DELETE FROM blog_posts WHERE slug = $1", slug)
    if res == "DELETE 0":
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}
