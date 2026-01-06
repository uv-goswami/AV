from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class OperationalInfoCreate(BaseModel):
    """
    Schema for establishing business operational parameters.
    Captures essential facility data such as hours, accessibility, and 
    amenities to improve the accuracy of local SEO listings and AI search results.
    """
    business_id: UUID
    opening_hours: str   # Formatted string for crawler readability
    closing_hours: str   # Formatted string for crawler readability
    off_days: Optional[List[str]] = []  # List of weekdays when the business is closed
    delivery_options: Optional[str] = None
    reservation_options: Optional[str] = None
    wifi_available: bool = False
    accessibility_features: Optional[str] = None
    special_notes: Optional[str] = None
    nearby_parking_spot: Optional[str] = None

class OperationalInfoOut(BaseModel):
    """
    Response schema for operational details.
    Delivers a comprehensive facility profile to the frontend, including 
    audit timestamps for data freshness tracking.
    """
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
        # Enables seamless translation from SQLAlchemy database objects to JSON
        orm_mode = True