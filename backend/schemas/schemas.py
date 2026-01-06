from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from db.models import ServiceTypeEnum

# -------------------------
# USERS: Data Transfer Objects
# -------------------------
class UserCreate(BaseModel):
    """
    Schema for initial user onboarding. 
    Enforces email formatting and authentication provider requirements.
    """
    email: EmailStr
    name: Optional[str] = None
    auth_provider: str
    password_hash: Optional[str] = None

class UserOut(BaseModel):
    """
    Standardized user response schema.
    Safely exposes account metadata while excluding sensitive fields like password hashes.
    """
    user_id: UUID
    email: EmailStr
    name: Optional[str]
    auth_provider: str
    created_at: datetime
    last_login: Optional[datetime]
    is_active: bool

    class Config:
        # Configuration to bridge Pydantic with SQLAlchemy database models
        orm_mode = True


# -------------------------
# AUTH: Authentication Schemas
# -------------------------
class LoginRequest(BaseModel):
    """
    Strict validation schema for login attempts. 
    Uses EmailStr for automated format verification at the entry point.
    """
    email: EmailStr
    password: str


# -------------------------
# BUSINESS: Profile Management
# -------------------------
class BusinessCreate(BaseModel):
    """
    Onboarding schema for establishing a business entity.
    Captures essential profile details and geographical coordinates for local SEO.
    """
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
    """
    Comprehensive business profile response.
    Includes system metadata like versioning and audit timestamps.
    """
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
# COUPONS: Promotional Offers
# -------------------------
class CouponCreate(BaseModel):
    """
    Schema for campaign generation. 
    Requires specific validity windows to prevent expired data entry.
    """
    business_id: UUID
    code: str
    description: Optional[str] = None
    discount_value: str
    valid_from: datetime
    valid_until: datetime
    terms_conditions: Optional[str] = None
    is_active: bool = True

class CouponOut(BaseModel):
    """Detailed coupon metadata for frontend display and verification."""
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
# MEDIA: Asset Management
# -------------------------
class MediaCreate(BaseModel):
    """Captures metadata and file access URLs for business images and videos."""
    business_id: UUID
    media_type: str  # Enum: image, video, document
    url: str
    alt_text: Optional[str] = None

class MediaOut(BaseModel):
    """Response schema for asset retrieval and display."""
    asset_id: UUID
    business_id: UUID
    media_type: str
    url: str
    alt_text: Optional[str]
    uploaded_at: datetime

    class Config:
        orm_mode = True


# -------------------------
# OPERATIONAL INFO: Facility Data
# -------------------------
class OperationalInfoCreate(BaseModel):
    """
    Schema for facility-specific parameters.
    Facilitates structured data collection for search engines and accessibility bots.
    """
    business_id: UUID
    opening_hours: str
    closing_hours: str
    off_days: Optional[List[str]] = None
    delivery_options: Optional[str] = None
    reservation_options: Optional[str] = None
    wifi_available: bool = False
    accessibility_features: Optional[str] = None
    nearby_parking_spot: Optional[str] = None 
    special_notes: Optional[str] = None

class OperationalInfoOut(BaseModel):
    """Aggregated operational profile for public and private dashboards."""
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
# SERVICES: Offerings & Specializations
# -------------------------
class ServiceCreate(BaseModel):
    """Standardized service registration across various industries."""
    business_id: UUID
    service_type: ServiceTypeEnum
    name: str
    description: Optional[str] = None
    price: float

class ServiceOut(BaseModel):
    """Response payload for business service lists."""
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
    """Extended parameters for culinary-specific service offerings."""
    service_id: UUID
    cuisine_type: str
    dietary_tags: Optional[str] = None
    portion_size: Optional[str] = None
    is_vegan: bool = True

class RestaurantServiceFieldsOut(BaseModel):
    """Serialized culinary extension data."""
    service_id: UUID
    cuisine_type: str
    dietary_tags: Optional[str]
    portion_size: Optional[str]
    is_vegan: bool

    class Config:
        orm_mode = True

class SalonServiceFieldsCreate(BaseModel):
    """Extended parameters for beauty and wellness services."""
    service_id: UUID
    stylist_required: bool = False
    gender_specific: str = "male"

class SalonServiceFieldsOut(BaseModel):
    """Serialized salon extension data."""
    service_id: UUID
    stylist_required: bool
    gender_specific: str

    class Config:
        orm_mode = True


# -------------------------
# AI METADATA: AI-Driven Insights
# -------------------------
class AiMetadataCreate(BaseModel):
    """Schema for storing results from LLM-based business analysis."""
    business_id: UUID
    extracted_insights: Optional[str] = None
    detected_entities: Optional[str] = None
    keywords: Optional[str] = None
    intent_labels: Optional[str] = None

class AiMetadataOut(BaseModel):
    """Serialized AI metadata for SEO and recommendation engines."""
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
# JSON-LD FEED: SEO Structured Data
# -------------------------
class JsonLDFeedCreate(BaseModel):
    """Schema for managing Schema.org compliant structured data scripts."""
    business_id: UUID
    schema_type: str
    jsonld_data: str
    is_valid: bool = False
    validation_errors: Optional[str] = None

class JsonLDFeedOut(BaseModel):
    """Delivery schema for SEO scripts to bot-readable public pages."""
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
# VISIBILITY: Audit Logs & Results
# -------------------------
class VisibilityCheckRequestCreate(BaseModel):
    """Request schema for initiating automated visibility audits."""
    business_id: UUID
    check_type: str
    input_data: Optional[str] = None

class VisibilityCheckRequestOut(BaseModel):
    """Serialized audit log entry."""
    request_id: UUID
    business_id: UUID
    check_type: str
    input_data: Optional[str]
    requested_at: datetime

    class Config:
        orm_mode = True

class VisibilityCheckResultCreate(BaseModel):
    """Schema for persisting audit findings and AI-generated scores."""
    request_id: UUID
    business_id: UUID
    visibility_score: Optional[float] = None
    issues_found: Optional[str] = None
    recommendations: Optional[str] = None
    output_snapshot: Optional[str] = None

class VisibilityCheckResultOut(BaseModel):
    """Response schema for auditing reports and business health dashboards."""
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
    """Schema for tracking actionable system-generated SEO improvements."""
    business_id: UUID
    suggestion_type: str
    title: str
    status: str = "pending"

class VisibilitySuggestionOut(BaseModel):
    """Response schema for the business owner's actionable task list."""
    suggestion_id: UUID
    business_id: UUID
    suggestion_type: str
    title: str
    status: str
    suggested_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        orm_mode = True