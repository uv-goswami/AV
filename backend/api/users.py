import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from db.models import User
from schemas.users import UserCreate, UserOut
from api.security import get_password_hash 

# Router for user account management and registration services
router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    User Registration Workflow:
    1. Validates that the email address is unique.
    2. Hashes the user's password for secure storage.
    3. Persists the new user record.
    4. Automatically initializes a placeholder business profile to streamline onboarding.
    """
    # Ensure the email is not already registered to prevent duplicate accounts
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")

    # Construct the User object with a unique UUID and hashed credentials
    new_user = User(
        user_id=uuid.uuid4(),
        email=user.email,
        name=user.name,
        auth_provider=user.auth_provider,
        password_hash=get_password_hash(user.password_hash), 
        created_at=datetime.utcnow(),
        is_active=True
    )
    
    # Save the user to the database [cite: 116]
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automated Onboarding: Create a default business profile for the new user [cite: 116]
    # This ensures every user has a workspace ready immediately after signup [cite: 116]
    auto_business = models.BusinessProfile(
        owner_id=new_user.user_id,
        name=f"{(new_user.name or 'New')} Business",
        description="Auto-created on signup",
        published=True
    )
    db.add(auto_business)
    db.commit()

    return new_user

@router.get("/by-email/{email}", response_model=UserOut)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    """
    Look up a user profile by their unique email address.
    Used for account verification and internal profile management.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user