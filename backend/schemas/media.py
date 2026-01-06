from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class MediaCreate(BaseModel):
    business_id: UUID
    media_type: str  # Enum: image, video, document
    url: str
    alt_text: str | None = None

class MediaOut(BaseModel):
    asset_id: UUID
    business_id: UUID
    media_type: str
    url: str
    alt_text: str | None
    uploaded_at: datetime

    class Config:
        orm_mode = True
