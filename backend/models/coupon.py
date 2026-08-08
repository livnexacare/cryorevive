from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel


class CouponIn(BaseModel):
    code: str
    discount_type: Literal["percentage", "flat"] = "percentage"
    discount_value: float
    min_order_value: float = 0
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None
    description: Optional[str] = ""
    is_active: bool = True


class CouponUpdate(BaseModel):
    discount_type: Optional[Literal["percentage", "flat"]] = None
    discount_value: Optional[float] = None
    min_order_value: Optional[float] = None
    usage_limit: Optional[int] = None
    expires_at: Optional[datetime] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CouponValidateIn(BaseModel):
    code: str
    order_value: float
