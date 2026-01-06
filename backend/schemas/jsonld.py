from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class JsonLDFeedCreate(BaseModel):
    business_id: UUID
    schema_type: str  # Enum: schema_type_enum
    jsonld_data: str
    is_valid: bool = False
    validation_errors: str | None = None

class JsonLDFeedOut(BaseModel):
    feed_id: UUID
    business_id: UUID
    schema_type: str
    jsonld_data: str
    is_valid: bool
    validation_errors: str | None
    generated_at: datetime

    class Config:
        orm_mode = True
