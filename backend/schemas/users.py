from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    auth_provider: str
    password_hash: str | None = None

class UserOut(BaseModel):
    user_id: UUID
    email: EmailStr
    name: str | None
    auth_provider: str
    created_at: datetime
    last_login: datetime | None
    is_active: bool

    class Config:
        orm_mode = True
