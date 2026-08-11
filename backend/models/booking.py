from datetime import date as Date
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class BookingIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    service_type: Literal[
        "ice_bath", "steam_sauna", "contrast_therapy",
        "cryo_chamber", "compression_therapy", "full_body_recovery",
        "mobile_unit",
        "cupping_therapy", "deep_tissue_massage", "physiotherapy",
    ]
    date: Date       # YYYY-MM-DD, parsed to datetime.date by Pydantic
    time_slot: str   # HH:MM (e.g. "09:00")
    notes: Optional[str] = ""


BookingStatus = Literal[
    "pending", "confirmed", "cancelled", "completed", "no_show", "postponed"
]
PaymentStatus = Literal["unpaid", "paid", "refunded", "partial"]


class BookingStatusIn(BaseModel):
    status: BookingStatus


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    payment_status: Optional[PaymentStatus] = None
    service_type: Optional[str] = None
    date: Optional[Date] = None
    time_slot: Optional[str] = None
    notes: Optional[str] = None
