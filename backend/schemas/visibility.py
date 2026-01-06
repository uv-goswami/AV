from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

# Check request
class VisibilityCheckRequestCreate(BaseModel):
    business_id: UUID
    check_type: str  # Enum: check_type_enum
    input_data: str | None = None

class VisibilityCheckRequestOut(BaseModel):
    request_id: UUID
    business_id: UUID
    check_type: str
    input_data: str | None
    requested_at: datetime

    class Config:
        orm_mode = True

# Check result
class VisibilityCheckResultCreate(BaseModel):
    request_id: UUID
    business_id: UUID
    visibility_score: float | None = None
    issues_found: str | None = None
    recommendations: str | None = None
    output_snapshot: str | None = None

class VisibilityCheckResultOut(BaseModel):
    result_id: UUID
    request_id: UUID
    business_id: UUID
    visibility_score: float | None
    issues_found: str | None
    recommendations: str | None
    output_snapshot: str | None
    completed_at: datetime

    class Config:
        orm_mode = True

# Suggestions
class VisibilitySuggestionCreate(BaseModel):
    business_id: UUID
    suggestion_type: str  # Enum: suggestion_type_enum
    title: str
    status: str = "pending"

class VisibilitySuggestionOut(BaseModel):
    suggestion_id: UUID
    business_id: UUID
    suggestion_type: str
    title: str
    status: str
    suggested_at: datetime
    resolved_at: datetime | None = None

    class Config:
        orm_mode = True
