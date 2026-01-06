from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

# Import related schemas to support aggregated data views
from .operational_info import OperationalInfoOut
from .media import MediaOut
from .services import ServiceOut
from .coupons import CouponOut

class BusinessCreate(BaseModel):
    """
    Schema for initial business registration.
    Defines the mandatory and optional fields required to establish 
    a new business entity in the system.
    """
    owner_id: UUID
    name: str
    description: str | None = None
    business_type: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    timezone: str | None = None
    quote_slogan: str | None = None
    identification_mark: str | None = None
    published: bool = True

    model_config = {"from_attributes": True}

class BusinessOut(BaseModel):
    """
    Standard response schema for business profile data.
    Used for single-object retrieval, ensuring consistent formatting
    for timestamps and unique identifiers across the API.
    """
    business_id: UUID
    owner_id: UUID
    name: str
    description: str | None
    business_type: str | None
    phone: str | None
    website: str | None
    address: str | None
    latitude: float | None
    longitude: float | None
    timezone: str | None
    quote_slogan: str | None
    identification_mark: str | None
    published: bool
    version: int
    created_at: datetime
    updated: datetime | None = None

    model_config = {"from_attributes": True}

class BusinessUpdate(BaseModel):
    """
    Schema for partial updates (PATCH) of business profiles.
    All fields are optional, allowing the frontend to send only 
    the specific attributes that need to be modified.
    """
    name: str | None = None
    description: str | None = None
    business_type: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    timezone: str | None = None
    quote_slogan: str | None = None
    identification_mark: str | None = None
    published: bool | None = None

class BusinessDirectoryView(BaseModel):
    """
    Aggregated System Design Schema:
    Optimized for high-performance directory listings. This schema bundles 
    the business profile with its nested relationships (media, services, coupons) 
    into a single JSON response, significantly reducing the number of 
    client-side network requests.
    """
    business_id: UUID
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    business_type: Optional[str] = None
    quote_slogan: Optional[str] = None
    identification_mark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Nested relationship mapping for complex UI components
    operational_info: Optional[OperationalInfoOut] = None
    media: List[MediaOut] = []
    services: List[ServiceOut] = []
    coupons: List[CouponOut] = []

    model_config = {"from_attributes": True}