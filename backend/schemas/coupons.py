from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class CouponCreate(BaseModel):
    """
    Schema for generating new promotional offers.
    Enforces required fields such as the unique coupon code, discount value, 
    and validity period to ensure complete data before database insertion.
    """
    business_id: UUID
    code: str
    description: str | None = None
    discount_value: str
    valid_from: datetime
    valid_until: datetime
    terms_conditions: str | None = None
    is_active: bool = True

class CouponUpdate(BaseModel):
    """
    Schema designed for partial updates (PATCH) to existing coupons.
    By making all fields Optional, it allows the frontend to send only the specific 
    attributes that have changed (e.g., extending a deadline or toggling status) 
    without causing validation errors.
    """
    business_id: Optional[UUID] = None
    code: Optional[str] = None
    description: Optional[str] = None
    discount_value: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    terms_conditions: Optional[str] = None
    is_active: Optional[bool] = None

class CouponOut(BaseModel):
    """
    The response schema for coupon data.
    Provides a safe way to share coupon details with the frontend, 
    formatting timestamps and IDs for standard JSON consumption.
    """
    coupon_id: UUID
    business_id: UUID
    code: str
    description: str | None
    discount_value: str
    valid_from: datetime
    valid_until: datetime
    terms_conditions: str | None
    is_active: bool

    class Config:
        # Configures Pydantic to extract data from SQLAlchemy objects (ORM models)
        from_attributes = True