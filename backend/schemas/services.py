from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from db.models import ServiceTypeEnum

class ServiceCreate(BaseModel):
    """
    Base schema for creating a business service.
    Enforces core attributes like pricing and service classification 
    to maintain consistent financial and category data.
    """
    business_id: UUID
    service_type: ServiceTypeEnum
    name: str
    description: str | None = None
    price: float

class ServiceOut(BaseModel):
    """
    Standard output schema for general service data.
    Includes system-generated metadata such as the unique service ID 
    and the creation timestamp for audit tracking.
    """
    service_id: UUID
    business_id: UUID
    service_type: str
    name: str
    description: str | None
    price: float
    created_at: datetime

    class Config:
        # Allows Pydantic to bridge directly with SQLAlchemy model instances
        orm_mode = True

# -------------------------
# INDUSTRY-SPECIFIC EXTENSIONS
# -------------------------

class RestaurantServiceFieldsCreate(BaseModel):
    """
    Schema for culinary-specific attributes.
    Captures dietary and portion data essential for food-based service listings.
    """
    service_id: UUID
    cuisine_type: str
    dietary_tags: str | None = None
    portion_size: str | None = None
    is_vegan: bool = True

class RestaurantServiceFieldsOut(BaseModel):
    """Serialized output for restaurant-specific service details."""
    service_id: UUID
    cuisine_type: str
    dietary_tags: str | None
    portion_size: str | None
    is_vegan: bool

    class Config:
        orm_mode = True

class SalonServiceFieldsCreate(BaseModel):
    """
    Schema for beauty and wellness service attributes.
    Captures operational needs like stylist requirements and target demographics.
    """
    service_id: UUID
    stylist_required: bool = False
    gender_specific: str = "male"

class SalonServiceFieldsOut(BaseModel):
    """Serialized output for salon-specific service details."""
    service_id: UUID
    stylist_required: bool
    gender_specific: str

    class Config:
        orm_mode = True

# -------------------------
# UPDATE SCHEMAS
# -------------------------

class ServiceUpdate(BaseModel):
    """
    Schema for partial service updates (PATCH).
    Allows the business owner to modify specific details like price or 
    description without resending the entire service object.
    """
    name: str | None = None
    description: str | None = None
    price: float | None = None
    service_type: ServiceTypeEnum | None = None