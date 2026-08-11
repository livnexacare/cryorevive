import os
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from database import db_execute, db_fetch, db_fetchrow, row_to_dict, rows_to_list
from models.payroll import AttendanceCreate, PayrollCreate, PayrollUpdate

router = APIRouter(prefix="/api", tags=["payroll"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")
STAFF_KEY = os.environ.get("STAFF_API_KEY", "")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_staff(x_staff_key: str) -> None:
    if not x_staff_key or x_staff_key not in (STAFF_KEY, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="Forbidden")


def _compute_total(pay_type: str, daily_wage, monthly_salary, days_worked: int) -> int:
    if pay_type == "daily" and daily_wage:
        return daily_wage * days_worked
    if pay_type == "monthly" and monthly_salary:
        return monthly_salary
    return 0


# ── Payroll ──────────────────────────────────────────────────────────────


@router.get("/payroll")
async def list_payroll(
    staff_id: Optional[str] = Query(None),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    if staff_id:
        rows = await db_fetch(
            "SELECT * FROM staff_payroll WHERE staff_id = $1 ORDER BY period_start DESC",
            staff_id,
        )
    else:
        rows = await db_fetch("SELECT * FROM staff_payroll ORDER BY period_start DESC")
    return rows_to_list(rows)


@router.post("/payroll", status_code=201)
async def create_payroll(
    data: PayrollCreate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    total = _compute_total(data.pay_type, data.daily_wage, data.monthly_salary, data.days_worked)
    amount_pending = total - data.amount_paid

    row = await db_fetchrow(
        """INSERT INTO staff_payroll
           (staff_id, staff_name, pay_type, daily_wage, monthly_salary,
            period_start, period_end, days_worked, total_amount,
            amount_paid, amount_pending, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           RETURNING *""",
        data.staff_id, data.staff_name, data.pay_type,
        data.daily_wage, data.monthly_salary,
        data.period_start, data.period_end,
        data.days_worked, total, data.amount_paid,
        amount_pending, data.notes,
    )
    return row_to_dict(row)


@router.patch("/payroll/{payroll_id}")
async def update_payroll(
    payroll_id: str,
    data: PayrollUpdate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    current = await db_fetchrow("SELECT * FROM staff_payroll WHERE id = $1", payroll_id)
    if not current:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    current = row_to_dict(current)

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "days_worked" in updates or "amount_paid" in updates or "daily_wage" in updates or "monthly_salary" in updates:
        days = updates.get("days_worked", current["days_worked"])
        paid = updates.get("amount_paid", current["amount_paid"])
        wage = updates.get("daily_wage", current["daily_wage"])
        salary = updates.get("monthly_salary", current["monthly_salary"])

        total = _compute_total(current["pay_type"], wage, salary, days)
        updates["total_amount"] = total
        updates["amount_pending"] = total - paid

    fields = [f"{k} = ${i + 1}" for i, k in enumerate(updates.keys())]
    values = list(updates.values())
    values.append(payroll_id)

    await db_execute(
        f"UPDATE staff_payroll SET {', '.join(fields)}, updated_at = NOW() WHERE id = ${len(values)}",
        *values,
    )
    return row_to_dict(await db_fetchrow("SELECT * FROM staff_payroll WHERE id = $1", payroll_id))


@router.get("/payroll/my")
async def get_my_payroll(
    staff_id: str = Query(...),
    x_staff_key: str = Header(default="", alias="X-Staff-Key"),
):
    """Staff self-service view. X-Staff-Key is a shared secret across all
    staff (see clients.py), so it only proves the caller is staff — the
    staff_id query param says whose payroll to return."""
    _require_staff(x_staff_key)
    rows = await db_fetch(
        "SELECT * FROM staff_payroll WHERE staff_id = $1 ORDER BY period_start DESC",
        staff_id,
    )
    return rows_to_list(rows)


# ── Attendance ───────────────────────────────────────────────────────────


@router.get("/attendance")
async def get_attendance(
    staff_id: str = Query(...),
    month: Optional[str] = Query(None, description="YYYY-MM"),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    if month:
        rows = await db_fetch(
            """SELECT * FROM staff_attendance
               WHERE staff_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
               ORDER BY date DESC""",
            staff_id, month,
        )
    else:
        rows = await db_fetch(
            "SELECT * FROM staff_attendance WHERE staff_id = $1 ORDER BY date DESC LIMIT 30",
            staff_id,
        )
    return rows_to_list(rows)


@router.post("/attendance", status_code=201)
async def mark_attendance(
    data: AttendanceCreate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    row = await db_fetchrow(
        """INSERT INTO staff_attendance
           (staff_id, date, status, check_in, check_out, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (staff_id, date) DO UPDATE SET
             status = EXCLUDED.status,
             check_in = EXCLUDED.check_in,
             check_out = EXCLUDED.check_out,
             notes = EXCLUDED.notes
           RETURNING *""",
        data.staff_id, data.date, data.status,
        data.check_in, data.check_out, data.notes,
    )
    return row_to_dict(row)
