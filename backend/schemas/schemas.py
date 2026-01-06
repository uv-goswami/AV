from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from db.models import ServiceTypeEnum

# -------------------------
# USERS
# -------------------------
class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    auth_provider: str
    password_hash: Optional[str] = None

class UserOut(BaseModel):
    user_id: UUID
    email: EmailStr
    name: Optional[str]
    auth_provider: str
    created_at: datetime
    last_login: Optional[datetime]
    is_active: bool

    class Config:
        orm_mode = True


# -------------------------
# AUTH
# -------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# BUSINESS
# -------------------------
class BusinessCreate(BaseModel):
    owner_id: UUID
    name: str
    description: Optional[str] = None
    business_type: Optional[str] = None  # restaurant, salon, clinic
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: Optional[str] = None
    quote_slogan: Optional[str] = None
    identification_mark: Optional[str] = None
    published: bool = True

    model_config = {"from_attributes": True}

class BusinessOut(BaseModel):
    business_id: UUID
    owner_id: UUID
    name: str
    description: Optional[str]
    business_type: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    timezone: Optional[str]
    quote_slogan: Optional[str]
    identification_mark: Optional[str]
    published: bool
    version: int
    created_at: datetime
    updated: Optional[datetime] = None

    model_config = {"from_attributes": True}


# -------------------------
# COUPONS
# -------------------------
class CouponCreate(BaseModel):
    business_id: UUID
    code: str
    description: Optional[str] = None
    discount_value: str
    valid_from: datetime
    valid_until: datetime
    terms_conditions: Optional[str] = None
    is_active: bool = True

class CouponOut(BaseModel):
    coupon_id: UUID
    business_id: UUID
    code: str
    description: Optional[str]
    discount_value: str
    valid_from: datetime
    valid_until: datetime
    terms_conditions: Optional[str]
    is_active: bool

    class Config:
        orm_mode = True


# -------------------------
# MEDIA
# -------------------------
class MediaCreate(BaseModel):
    business_id: UUID
    media_type: str  # Enum: image, video, document
    url: str
    alt_text: Optional[str] = None

class MediaOut(BaseModel):
    asset_id: UUID
    business_id: UUID
    media_type: str
    url: str
    alt_text: Optional[str]
    uploaded_at: datetime

    class Config:
        orm_mode = True


# -------------------------
# OPERATIONAL INFO
# -------------------------
class OperationalInfoCreate(BaseModel):
    business_id: UUID
    opening_hours: str
    closing_hours: str
    off_days: Optional[List[str]] = None
    delivery_options: Optional[str] = None
    reservation_options: Optional[str] = None
    wifi_available: bool = False
    accessibility_features: Optional[str] = None
    nearby_parking_spot: Optional[str] = None  # fixed typo
    special_notes: Optional[str] = None

class OperationalInfoOut(BaseModel):
    info_id: UUID
    business_id: UUID
    opening_hours: str
    closing_hours: str
    off_days: Optional[List[str]]
    delivery_options: Optional[str]
    reservation_options: Optional[str]
    wifi_available: bool
    accessibility_features: Optional[str]
    nearby_parking_spot: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# -------------------------
# SERVICES
# -------------------------
class ServiceCreate(BaseModel):
    business_id: UUID
    service_type: ServiceTypeEnum
    name: str
    description: Optional[str] = None
    price: float

class ServiceOut(BaseModel):
    service_id: UUID
    business_id: UUID
    service_type: str
    name: str
    description: Optional[str]
    price: float
    created_at: datetime

    class Config:
        orm_mode = True

class RestaurantServiceFieldsCreate(BaseModel):
    service_id: UUID
    cuisine_type: str
    dietary_tags: Optional[str] = None
    portion_size: Optional[str] = None
    is_vegan: bool = True

class RestaurantServiceFieldsOut(BaseModel):
    service_id: UUID
    cuisine_type: str
    dietary_tags: Optional[str]
    portion_size: Optional[str]
    is_vegan: bool

    class Config:
        orm_mode = True

class SalonServiceFieldsCreate(BaseModel):
    service_id: UUID
    stylist_required: bool = False
    gender_specific: str = "male"

class SalonServiceFieldsOut(BaseModel):
    service_id: UUID
    stylist_required: bool
    gender_specific: str

    class Config:
        orm_mode = True


# -------------------------
# AI METADATA
# -------------------------
class AiMetadataCreate(BaseModel):
    business_id: UUID
    extracted_insights: Optional[str] = None
    detected_entities: Optional[str] = None
    keywords: Optional[str] = None
    intent_labels: Optional[str] = None

class AiMetadataOut(BaseModel):
    ai_metadata_id: UUID
    business_id: UUID
    extracted_insights: Optional[str]
    detected_entities: Optional[str]
    keywords: Optional[str]
    intent_labels: Optional[str]
    generated_at: datetime

    class Config:
        orm_mode = True


# -------------------------
# JSON-LD FEED
# -------------------------
class JsonLDFeedCreate(BaseModel):
    business_id: UUID
    schema_type: str
    jsonld_data: str
    is_valid: bool = False
    validation_errors: Optional[str] = None

class JsonLDFeedOut(BaseModel):
    feed_id: UUID
    business_id: UUID
    schema_type: str
    jsonld_data: str
    is_valid: bool
    validation_errors: Optional[str]
    generated_at: datetime

    class Config:
        orm_mode = True


# -------------------------
# VISIBILITY
# -------------------------
class VisibilityCheckRequestCreate(BaseModel):
    business_id: UUID
    check_type: str
    input_data: Optional[str] = None

class VisibilityCheckRequestOut(BaseModel):
    request_id: UUID
    business_id: UUID
    check_type: str
    input_data: Optional[str]
    requested_at: datetime

    class Config:
        orm_mode = True

class VisibilityCheckResultCreate(BaseModel):
    request_id: UUID
    business_id: UUID
    visibility_score: Optional[float] = None
    issues_found: Optional[str] = None
    recommendations: Optional[str] = None
    output_snapshot: Optional[str] = None

class VisibilityCheckResultOut(BaseModel):
    result_id: UUID
    request_id: UUID
    business_id: UUID
    visibility_score: Optional[float]
    issues_found: Optional[str]
    recommendations: Optional[str]
    output_snapshot: Optional[str]
    completed_at: datetime

    class Config:
        orm_mode = True

class VisibilitySuggestionCreate(BaseModel):
    business_id: UUID
    suggestion_type: str
    title: str
    status: str = "pending"

class VisibilitySuggestionOut(BaseModel):
    suggestion_id: UUID
    business_id: UUID
    suggestion_type: str
    title: str
    status: str
    suggested_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        orm_mode = True
