from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime, Enum, Numeric
from sqlalchemy.dialects.postgresql import UUID, CITEXT
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
import uuid
from pydantic import BaseModel
from datetime import datetime, UTC
from db.database import Base
import enum

class ServiceTypeEnum(str, enum.Enum):
    salon = "salon"
    restaurant = "restaurant"
    clinic = "clinic"

# -------------------------
# USERS: Core Account Entity
# -------------------------
class User(Base):
    """
    Stores authenticated user credentials and profile information.
    Uses CITEXT for email to ensure case-insensitive uniqueness at the database level.
    """
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(CITEXT, unique=True, nullable=False)
    name = Column(String)
    auth_provider = Column(String, nullable=False) 
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    # One-to-Many relationship: A user can own multiple business profiles
    businesses = relationship("BusinessProfile", back_populates="owner")


# -------------------------
# BUSINESS PROFILES: Central Entity
# -------------------------
class BusinessProfile(Base):
    """
    The central hub of the application. Connects users to their services, 
    media assets, and AI-generated SEO metadata.
    """
    __tablename__ = "business_profiles"

    business_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)

    name = Column(String, nullable=False)
    description = Column(String)
    business_type = Column(Enum("restaurant", "salon", "clinic", name="business_type_enum"), nullable=True)
    phone = Column(String)
    website = Column(String)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float) 
    timezone = Column(String)
    quote_slogan = Column(String)
    identification_mark = Column(String)
    published = Column(Boolean, nullable=False, default=True)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated = Column(DateTime(timezone=True))

    owner = relationship("User", back_populates="businesses")
    services = relationship("Service", back_populates="business")
    media_assets = relationship("MediaAsset", back_populates="business")
    coupons = relationship("Coupon", back_populates="business")
    ai_metadata = relationship("AiMetadata", back_populates="business")


# -------------------------
# SERVICES: Offerings & Extensions
# -------------------------
class Service(Base):
    """
    Defines general service offerings. Uses a polymorphic-style approach 
    where specific fields are stored in child tables (Restaurant/Salon).
    """
    __tablename__ = "services"

    service_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    service_type = Column(Enum(ServiceTypeEnum, name="service_type_enum"), nullable=False) 
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Numeric(10, 2), nullable=False) # Precision pricing for financial accuracy
    currency = Column(String, nullable=False, default="INR")
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True))

    business = relationship("BusinessProfile", back_populates="services")
    # One-to-One relationships for industry-specific data
    restaurant_fields = relationship("RestaurantServiceFields", uselist=False, back_populates="service")
    salon_fields = relationship("SalonServiceFields", uselist=False, back_populates="service")


class RestaurantServiceFields(Base):
    """Extended attributes specifically for food and beverage services."""
    __tablename__ = "restaurant_service_fields"

    service_id = Column(UUID(as_uuid=True), ForeignKey("services.service_id", ondelete="CASCADE"), primary_key=True)
    cuisine_type = Column(String, nullable=False)
    dietary_tags = Column(String)
    portion_size = Column(String)
    is_vegan = Column(Boolean, default=True)

    service = relationship("Service", back_populates="restaurant_fields")


class SalonServiceFields(Base):
    """Extended attributes specifically for wellness and beauty services."""
    __tablename__ = "salon_service_fields"

    service_id = Column(UUID(as_uuid=True), ForeignKey("services.service_id", ondelete="CASCADE"), primary_key=True)
    duration_minutes = Column(Integer)
    stylist_required = Column(Boolean, default=False)
    gender_specific = Column(Enum("male", "female", "unisex", name="gender_specific_enum"), nullable=False, default="male")

    service = relationship("Service", back_populates="salon_fields")


# -------------------------
# SYSTEM ENTITIES: Media, SEO, & Coupons
# -------------------------
class MediaAsset(Base):
    """Stores references to images, videos, and documents associated with a business."""
    __tablename__ = "media_assets"

    asset_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    media_type = Column(Enum("image", "video", "document", name="media_type_enum"), nullable=False)
    url = Column(String, nullable=False)
    alt_text = Column(String)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    business = relationship("BusinessProfile", back_populates="media_assets")

class VisibilityCheckRequest(Base):
    """Logs the history of audit requests triggered for the AI Visibility engine."""
    __tablename__ = "visibility_check_request"

    request_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    check_type = Column(Enum("visibility", "content_enhancement", "schema_completeness", name="check_type_enum"), nullable=False)
    input_data = Column(String)
    requested_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    business = relationship("BusinessProfile")

class VisibilityCheckResult(Base):
    """Stores the granular scores and AI analysis results from a visibility audit."""
    __tablename__ = "visibility_check_result"

    result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("visibility_check_request.request_id", ondelete="CASCADE"), nullable=False)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    visibility_score = Column(Numeric(5, 2))
    issues_found = Column(String)
    recommendations = Column(String)
    output_snapshot = Column(String)
    completed_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    business = relationship("BusinessProfile")
    request = relationship("VisibilityCheckRequest")

class VisibilitySuggestion(Base):
    """Stores actionable SEO tasks generated by the system for the business owner."""
    __tablename__ = "visibility_suggestions"

    suggestion_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    suggestion_type = Column(Enum("metadata_enhancement", "content_update", "seo", name="suggestion_type_enum"), nullable=False)
    title = Column(String, nullable=False)
    status = Column(Enum("pending", "implemented", "rejected", name="status_enum"), nullable=False, default="pending")
    suggested_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    resolved_at = Column(DateTime(timezone=True))

    business = relationship("BusinessProfile")

class AiMetadata(Base):
    """Stores AI-extracted keywords, entities, and marketing insights to feed into Schema.org feeds."""
    __tablename__ = "ai_metadata"

    ai_metadata_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    extracted_insights = Column(String)
    detected_entities = Column(String)
    keywords = Column(String)
    intent_labels = Column(String)
    generated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    business = relationship("BusinessProfile", back_populates="ai_metadata")

class Coupon(Base):
    """Manages promotional codes and discount parameters for businesses."""
    __tablename__ = "coupons"

    coupon_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    code = Column(String, nullable=False)
    description = Column(String)
    discount_value = Column(String, nullable=False)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    terms_conditions = Column(String)
    is_active = Column(Boolean, default=True)

    business = relationship("BusinessProfile", back_populates="coupons")

class JsonLDFeed(Base):
    """Stores generated structured data (JSON-LD) for SEO and AI crawler compatibility."""
    __tablename__ = "jsonld_feed"

    feed_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    schema_type = Column(Enum("Restaurant", "HairSalon", "MedicalClinic", name="schema_type_enum"), nullable=False)
    jsonld_data = Column(String, nullable=False)
    is_valid = Column(Boolean, nullable=False, default=False)
    validation_errors = Column(String)
    generated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))

    business = relationship("BusinessProfile")

class OperationalInfo(Base):
    """Stores high-level business logic such as hours, accessibility, and facility amenities."""
    __tablename__ = "operational_info"

    info_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_profiles.business_id", ondelete="CASCADE"), nullable=False)

    opening_hours = Column(String, nullable=False)
    closing_hours = Column(String, nullable=False)
    off_days = Column(ARRAY(String), default=[]) # Uses PostgreSQL ARRAY type for efficient list storage
    delivery_options = Column(String)
    reservation_options = Column(String)
    wifi_available = Column(Boolean, default=False)
    accessibility_features = Column(String)
    nearby_parking_spot = Column(String)
    special_notes = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True))

    business = relationship("BusinessProfile")