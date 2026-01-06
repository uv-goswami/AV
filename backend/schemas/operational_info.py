from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class OperationalInfoCreate(BaseModel):
    business_id: UUID
    opening_hours: str   # raw string for crawler
    closing_hours: str   # raw string for crawler
    off_days: Optional[List[str]] = []  # structured list of weekdays
    delivery_options: Optional[str] = None
    reservation_options: Optional[str] = None
    wifi_available: bool = False
    accessibility_features: Optional[str] = None
    special_notes: Optional[str] = None
    nearby_parking_spot: Optional[str] = None  # ✅ fixed typo

class OperationalInfoOut(BaseModel):
    info_id: UUID
    business_id: UUID
    opening_hours: str
    closing_hours: str
    off_days: Optional[List[str]] = []
    delivery_options: Optional[str]
    reservation_options: Optional[str]
    wifi_available: bool
    accessibility_features: Optional[str]
    special_notes: Optional[str] = None
    nearby_parking_spot: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
