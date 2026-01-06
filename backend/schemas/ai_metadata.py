from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AiMetadataCreate(BaseModel):
    """
    Data Transfer Object (DTO) for creating or updating AI Metadata.
    Defines the expected structure for incoming request payloads, 
    ensuring all AI-generated fields are formatted correctly before processing.
    """
    business_id: UUID
    extracted_insights: str | None = None
    detected_entities: str | None = None
    keywords: str | None = None
    intent_labels: str | None = None

class AiMetadataOut(BaseModel):
    """
    Response schema for AI Metadata.
    Handles the serialization of database objects into JSON format for the frontend.
    Includes system-generated fields like the unique ID and generation timestamp.
    """
    ai_metadata_id: UUID
    business_id: UUID
    extracted_insights: str | None
    detected_entities: str | None
    keywords: str | None
    intent_labels: str | None
    generated_at: datetime

    class Config:
        # Enables the schema to read data directly from SQLAlchemy models (ORM)
        # instead of requiring a standard Python dictionary.
        orm_mode = True