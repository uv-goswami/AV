from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

# -------------------------
# AUDIT REQUEST SCHEMAS
# -------------------------
class VisibilityCheckRequestCreate(BaseModel):
    """
    Schema for initiating a visibility audit.
    Captures the intent of the check (e.g., SEO, Schema, or Content) 
    and any specific input data required for the AI auditor.
    """
    business_id: UUID
    check_type: str  # Maps to internal audit categories
    input_data: str | None = None

class VisibilityCheckRequestOut(BaseModel):
    """
    Serialized output for an audit request log.
    Includes the system-generated request ID and the precise time the audit was queued.
    """
    request_id: UUID
    business_id: UUID
    check_type: str
    input_data: str | None
    requested_at: datetime

    class Config:
        # Configuration to bridge Pydantic with SQLAlchemy database models
        orm_mode = True

# -------------------------
# AUDIT RESULT SCHEMAS
# -------------------------
class VisibilityCheckResultCreate(BaseModel):
    """
    Schema for persisting audit findings.
    Stores the numerical score, identified friction points, and the raw 
    snapshot of the AI's analysis for future reference.
    """
    request_id: UUID
    business_id: UUID
    visibility_score: float | None = None
    issues_found: str | None = None
    recommendations: str | None = None
    output_snapshot: str | None = None

class VisibilityCheckResultOut(BaseModel):
    """
    Comprehensive audit report schema.
    Delivers the final score and actionable insights to the business dashboard 
    along with the completion timestamp.
    """
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

# -------------------------
# ACTIONABLE SUGGESTION SCHEMAS
# -------------------------
class VisibilitySuggestionCreate(BaseModel):
    """
    Schema for creating system-generated SEO tasks.
    Used to translate audit failures into specific, trackable 
    improvement suggestions for the business owner.
    """
    business_id: UUID
    suggestion_type: str 
    title: str
    status: str = "pending"

class VisibilitySuggestionOut(BaseModel):
    """
    Response schema for the business owner's task list.
    Tracks the lifecycle of a suggestion from creation to resolution.
    """
    suggestion_id: UUID
    business_id: UUID
    suggestion_type: str
    title: str
    status: str
    suggested_at: datetime
    resolved_at: datetime | None = None

    class Config:
        orm_mode = True