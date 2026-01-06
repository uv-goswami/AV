from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class JsonLDFeedCreate(BaseModel):
    """
    Schema for creating a new structured data feed.
    This model captures the raw JSON-LD payload along with initial 
    validation status and any errors found during the generation process.
    """
    business_id: UUID
    schema_type: str  # Maps to Schema.org types (e.g., Restaurant, HairSalon)
    jsonld_data: str  # The raw stringified JSON-LD script
    is_valid: bool = False
    validation_errors: str | None = None

class JsonLDFeedOut(BaseModel):
    """
    Response schema for structured data feeds.
    Provides the frontend or search crawlers with the final validated 
    JSON-LD script, including metadata on when the feed was last synchronized.
    """
    feed_id: UUID
    business_id: UUID
    schema_type: str
    jsonld_data: str
    is_valid: bool
    validation_errors: str | None
    generated_at: datetime

    class Config:
        # Compatibility configuration to allow Pydantic to parse SQLAlchemy models
        orm_mode = True