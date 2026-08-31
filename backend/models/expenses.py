from datetime import date as Date
from typing import Literal, Optional

from pydantic import BaseModel

ExpenseCategory = Literal[
    "rent",
    "electricity",
    "utilities",
    "salary",
    "equipment",
    "marketing",
    "maintenance",
    "supplies",
    "other",
]


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    subcategory: Optional[str] = None
    description: str
    amount: int
    expense_date: Date
    recurring: bool = False
    recurring_day: Optional[int] = None
    notes: Optional[str] = None
