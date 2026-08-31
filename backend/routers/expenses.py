import os
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from database import db_execute, db_fetch, db_fetchrow, row_to_dict, rows_to_list
from models.expenses import ExpenseCreate

router = APIRouter(prefix="/api", tags=["expenses"])

ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "")


def _require_admin(x_admin_key: str) -> None:
    if not ADMIN_KEY or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/expenses")
async def list_expenses(
    month: Optional[str] = Query(None, description="YYYY-MM"),
    category: Optional[str] = Query(None),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    conditions: list[str] = []
    params: list = []

    if month:
        params.append(month)
        conditions.append(f"TO_CHAR(expense_date, 'YYYY-MM') = ${len(params)}")
    if category:
        params.append(category)
        conditions.append(f"category = ${len(params)}")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    rows = await db_fetch(
        f"SELECT * FROM expenses {where} ORDER BY expense_date DESC, created_at DESC",
        *params,
    )
    return rows_to_list(rows)


@router.post("/expenses", status_code=201)
async def create_expense(
    data: ExpenseCreate,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    row = await db_fetchrow(
        """INSERT INTO expenses
           (category, subcategory, description, amount,
            expense_date, recurring, recurring_day, notes)
           VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8)
           RETURNING *""",
        data.category, data.subcategory, data.description, data.amount,
        data.expense_date, data.recurring, data.recurring_day, data.notes,
    )
    return row_to_dict(row)


@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)
    await db_execute("DELETE FROM expenses WHERE id = $1", expense_id)
    return {"status": "deleted"}


@router.get("/expenses/summary")
async def expense_summary(
    month: Optional[str] = Query(None, description="YYYY-MM; defaults to current month"),
    x_admin_key: str = Header(default="", alias="X-Admin-Key"),
):
    _require_admin(x_admin_key)

    if month:
        rows = await db_fetch(
            """SELECT category, SUM(amount)::bigint AS total
               FROM expenses
               WHERE TO_CHAR(expense_date, 'YYYY-MM') = $1
               GROUP BY category
               ORDER BY total DESC""",
            month,
        )
    else:
        rows = await db_fetch(
            """SELECT category, SUM(amount)::bigint AS total
               FROM expenses
               WHERE TO_CHAR(expense_date, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')
               GROUP BY category
               ORDER BY total DESC"""
        )

    by_category = rows_to_list(rows)
    monthly_total = sum(int(r["total"]) for r in by_category)

    return {"this_month": monthly_total, "by_category": by_category}
