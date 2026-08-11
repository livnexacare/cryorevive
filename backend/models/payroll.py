from datetime import date as Date, time as Time
from typing import Literal, Optional

from pydantic import BaseModel

PayType = Literal["daily", "monthly"]
AttendanceStatus = Literal["present", "absent", "half_day", "leave"]


class PayrollCreate(BaseModel):
    staff_id: str
    staff_name: str
    pay_type: PayType = "daily"
    daily_wage: Optional[int] = None
    monthly_salary: Optional[int] = None
    period_start: Date
    period_end: Date
    days_worked: int = 0
    amount_paid: int = 0
    notes: Optional[str] = None


class PayrollUpdate(BaseModel):
    days_worked: Optional[int] = None
    amount_paid: Optional[int] = None
    notes: Optional[str] = None
    daily_wage: Optional[int] = None
    monthly_salary: Optional[int] = None


class AttendanceCreate(BaseModel):
    staff_id: str
    date: Date
    status: AttendanceStatus = "present"
    check_in: Optional[Time] = None
    check_out: Optional[Time] = None
    notes: Optional[str] = None
