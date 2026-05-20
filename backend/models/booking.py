from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class BookingIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    service_type: Literal["ice_bath", "steam_sauna", "contrast_therapy", "mobile_unit"]
    date: str        # YYYY-MM-DD
    time_slot: str   # HH:MM (e.g. "09:00")
    notes: Optional[str] = ""


class BookingStatusIn(BaseModel):
    status: Literal["pending", "confirmed", "cancelled", "completed"]
