import os
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import db_fetch, rows_to_list

router = APIRouter(prefix="/api/admin", tags=["backup"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")

# Table -> column list. Names are a fixed allowlist (never user input).
BACKUP_TABLES: dict[str, str] = {
    "bookings": "*",
    "clients": "*",
    "memberships": "*",
    "membership_sessions": "*",
    "staff_accounts": "id, username, full_name, role, is_active, last_login, created_at",  # never password_hash
    "staff_payroll": "*",
    "staff_attendance": "*",
    "expenses": "*",
    "coupons": "*",
    "service_pricing": "*",
    "event_pricing": "*",
    "membership_plans": "*",
    "custom_slots": "*",
    "announcements": "*",
}


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/backup")
async def backup(
    table: str | None = Query(None, description="Single table; omit for all tables"),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    if table is not None and table not in BACKUP_TABLES:
        raise HTTPException(status_code=400, detail="Unknown table")
    names = [table] if table else list(BACKUP_TABLES)

    tables: dict = {}
    for name in names:
        try:
            rows = await db_fetch(f"SELECT {BACKUP_TABLES[name]} FROM {name}")
            tables[name] = rows_to_list(rows)
        except Exception as exc:  # table missing etc. — don't fail the whole backup
            tables[name] = {"error": type(exc).__name__}

    return jsonable_encoder({
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "tables": tables,
    })
