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


class BookingStatusIn(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "completed"]


class BookingStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "cancelled"]
