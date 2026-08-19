from datetime import date as Date
from typing import Literal, Optional

from pydantic import BaseModel

PackageType = Literal["starter", "athlete", "elite", "custom"]
MembershipStatus = Literal["active", "expired", "paused", "cancelled"]


class MembershipCreate(BaseModel):
    client_id: str
    client_name: str
    client_mobile: str
    package_type: PackageType
    sessions_total: int
    price_paid: int
    start_date: Date
    end_date: Date
    notes: Optional[str] = None


class MembershipUpdate(BaseModel):
    status: Optional[MembershipStatus] = None
    sessions_total: Optional[int] = None
    sessions_remaining: Optional[int] = None
    price_paid: Optional[int] = None
    end_date: Optional[Date] = None
    notes: Optional[str] = None


class SessionUse(BaseModel):
    service_type: str
    booking_id: Optional[str] = None
    staff_name: Optional[str] = None
    notes: Optional[str] = None
