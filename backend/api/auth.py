from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import User, BusinessProfile
from schemas.auth import LoginRequest
from api.security import verify_password 

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Query the database for the user based on the provided email address
    user = db.query(User).filter_by(email=data.email).first()
    
    # Validate credentials by checking if user exists and password hash matches
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Optimization: Retrieve the associated business ID during the login flow.
    # This provides the frontend with the necessary context to redirect the user
    # to their specific dashboard without requiring a second API call.
    business = db.query(BusinessProfile).filter_by(owner_id=user.user_id).first()
    business_id = str(business.business_id) if business else None

    # Return the authenticated session data in a single consolidated response
    return {
        "user_id": str(user.user_id),
        "business_id": business_id,
        "status": "authenticated"
    }