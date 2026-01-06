from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class MediaCreate(BaseModel):
    """
    Schema for recording new media assets.
    Captures the relationship between the business and its files, 
    storing the access URL and descriptive alt-text for accessibility compliance.
    """
    business_id: UUID
    media_type: str  # Supported categories: image, video, document
    url: str
    alt_text: str | None = None

class MediaOut(BaseModel):
    """
    Response schema for media assets.
    Used to deliver asset metadata to the frontend, including the system-generated 
    unique asset ID and the upload timestamp for sorting purposes.
    """
    asset_id: UUID
    business_id: UUID
    media_type: str
    url: str
    alt_text: str | None
    uploaded_at: datetime

    class Config:
        # Allows Pydantic to bridge directly with SQLAlchemy model instances
        orm_mode = True