import os
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from database import db_execute, db_fetch, db_fetchrow, row_to_dict, rows_to_list
from models.memberships import MembershipCreate, MembershipUpdate, SessionUse

router = APIRouter(prefix="/api", tags=["memberships"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")

PACKAGES = {
    "starter": {"name": "Starter", "sessions": 8, "price": 5999},
    "athlete": {"name": "Athlete", "sessions": 16, "price": 9999},
    "elite": {"name": "Elite", "sessions": 30, "price": 15999},
}

# How many package sessions each service consumes.
SESSION_WEIGHTS = {
    "ice_bath": 1,
    "steam_sauna": 1,
    "compression_therapy": 1,
    "deep_tissue_massage": 1,   # massage gun equivalent
    "cupping_therapy": 1,
    "cryo_chamber": 1,
    "mobile_unit": 1,
    "contrast_therapy": 2,
    "physiotherapy": 2,
    "full_body_recovery": 4,
}


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/memberships")
async def list_memberships(
    status: Optional[str] = Query(None),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    if status:
        rows = await db_fetch(
            "SELECT * FROM memberships WHERE status = $1 ORDER BY created_at DESC",
            status,
        )
    else:
        rows = await db_fetch("SELECT * FROM memberships ORDER BY created_at DESC")
    return rows_to_list(rows)


@router.get("/memberships/search")
async def search_memberships(
    q: str = Query(...),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    rows = await db_fetch(
        """SELECT * FROM memberships
           WHERE client_name ILIKE $1 OR client_mobile ILIKE $1
           ORDER BY created_at DESC LIMIT 20""",
        f"%{q}%",
    )
    return rows_to_list(rows)


@router.get("/memberships/client/{client_mobile}")
async def get_client_membership(
    client_mobile: str,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    """Check if a client has an active membership (used by staff app on client load)."""
    _require_admin(x_admin_key)
    row = await db_fetchrow(
        """SELECT * FROM memberships
           WHERE client_mobile = $1 AND status = 'active'
           ORDER BY created_at DESC LIMIT 1""",
        client_mobile,
    )
    if not row:
        return {"has_membership": False}
    return {"has_membership": True, "membership": row_to_dict(row)}


@router.post("/memberships", status_code=201)
async def create_membership(
    data: MembershipCreate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    package_name = PACKAGES.get(data.package_type, {}).get("name", data.package_type.title())

    row = await db_fetchrow(
        """INSERT INTO memberships (
             client_id, client_name, client_mobile, package_type,
             package_name, sessions_total, sessions_used,
             sessions_remaining, price_paid, start_date, end_date,
             status, notes
           ) VALUES ($1,$2,$3,$4,$5,$6,0,$6,$7,$8,$9,'active',$10)
           RETURNING *""",
        data.client_id, data.client_name, data.client_mobile,
        data.package_type, package_name, data.sessions_total,
        data.price_paid, data.start_date, data.end_date, data.notes,
    )
    return row_to_dict(row)


@router.post("/memberships/{membership_id}/use-session")
async def use_session(
    membership_id: str,
    data: SessionUse,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    current = await db_fetchrow("SELECT * FROM memberships WHERE id = $1", membership_id)
    if not current:
        raise HTTPException(status_code=404, detail="Membership not found")
    m = row_to_dict(current)

    if m["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Membership is {m['status']}")

    sessions_consumed = SESSION_WEIGHTS.get(data.service_type, 1)
    service_label = data.service_type.replace("_", " ").title()

    if m["sessions_remaining"] < sessions_consumed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough sessions remaining. {service_label} requires "
                f"{sessions_consumed} session(s), but only {m['sessions_remaining']} left."
            ),
        )

    session_note = f"Sessions consumed: {sessions_consumed}."
    if data.notes:
        session_note = f"{session_note} {data.notes}"

    await db_execute(
        """INSERT INTO membership_sessions
           (membership_id, booking_id, service_type, staff_name, notes)
           VALUES ($1, $2, $3, $4, $5)""",
        membership_id, data.booking_id, data.service_type, data.staff_name, session_note,
    )

    new_used = m["sessions_used"] + sessions_consumed
    new_remaining = m["sessions_remaining"] - sessions_consumed
    new_status = "active" if new_remaining > 0 else "expired"

    row = await db_fetchrow(
        """UPDATE memberships SET
             sessions_used = $1,
             sessions_remaining = $2,
             status = $3,
             updated_at = NOW()
           WHERE id = $4 RETURNING *""",
        new_used, new_remaining, new_status, membership_id,
    )
    return {
        **row_to_dict(row),
        "sessions_consumed": sessions_consumed,
        "message": f"{sessions_consumed} session(s) deducted for {service_label}",
    }


@router.patch("/memberships/{membership_id}")
async def update_membership(
    membership_id: str,
    data: MembershipUpdate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    current = await db_fetchrow("SELECT * FROM memberships WHERE id = $1", membership_id)
    if not current:
        raise HTTPException(status_code=404, detail="Membership not found")

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    fields = [f"{k} = ${i + 1}" for i, k in enumerate(updates.keys())]
    values = list(updates.values())
    values.append(membership_id)

    await db_execute(
        f"UPDATE memberships SET {', '.join(fields)}, updated_at = NOW() WHERE id = ${len(values)}",
        *values,
    )
    return row_to_dict(await db_fetchrow("SELECT * FROM memberships WHERE id = $1", membership_id))


@router.get("/memberships/{membership_id}/sessions")
async def get_session_history(
    membership_id: str,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    rows = await db_fetch(
        "SELECT * FROM membership_sessions WHERE membership_id = $1 ORDER BY used_on DESC",
        membership_id,
    )
    return rows_to_list(rows)
