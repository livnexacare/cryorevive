from pydantic import BaseModel


class PaymentInitIn(BaseModel):
    booking_id: str
    amount: float       # in INR (e.g. 999.0)
    currency: str = "INR"
