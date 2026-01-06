from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    """
    Data Transfer Object (DTO) for user registration.
    Enforces strict email validation using Pydantic's EmailStr and 
    defines the required fields for establishing a new account credential.
    """
    email: EmailStr
    name: str | None = None
    auth_provider: str
    password_hash: str | None = None

class UserOut(BaseModel):
    """
    Standardized response schema for user profiles.
    Ensures that sensitive information like password hashes are never 
    exposed in API responses while providing essential account metadata.
    """
    user_id: UUID
    email: EmailStr
    name: str | None
    auth_provider: str
    created_at: datetime
    last_login: datetime | None
    is_active: bool

    class Config:
        # Configures the schema to work seamlessly with SQLAlchemy ORM objects
        orm_mode = True