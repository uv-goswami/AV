from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from db.models import ServiceTypeEnum

class ServiceCreate(BaseModel):
    business_id: UUID
    service_type: ServiceTypeEnum
    name: str
    description: str | None = None
    price: float

class ServiceOut(BaseModel):
    service_id: UUID
    business_id: UUID
    service_type: str
    name: str
    description: str | None
    price: float
    created_at: datetime

    class Config:
        orm_mode = True

# Restaurant-specific fields
class RestaurantServiceFieldsCreate(BaseModel):
    service_id: UUID
    cuisine_type: str
    dietary_tags: str | None = None
    portion_size: str | None = None
    is_vegan: bool = True

class RestaurantServiceFieldsOut(BaseModel):
    service_id: UUID
    cuisine_type: str
    dietary_tags: str | None
    portion_size: str | None
    is_vegan: bool

    class Config:
        orm_mode = True

# Salon-specific fields
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


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    service_type: ServiceTypeEnum | None = None
