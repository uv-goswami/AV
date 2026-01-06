from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.operational_info import OperationalInfoCreate, OperationalInfoOut
from uuid import UUID

# Router for managing detailed operational data like hours, accessibility, and parking [cite: 65, 165]
router = APIRouter(tags=["Operational Info"])

@router.post("/", response_model=OperationalInfoOut)
def create_operational_info(data: OperationalInfoCreate, db: Session = Depends(get_db)):
    """
    Initializes operational details for a business profile.
    This endpoint enforces a one-to-one constraint, ensuring each business has 
    exactly one primary record for operational information.
    """
    # Verify the target business profile exists to maintain relational integrity 
    business = db.query(models.BusinessProfile).filter_by(business_id=data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Business Logic: Prevent duplicate operational entries for the same business entity 
    existing = db.query(models.OperationalInfo).filter_by(business_id=data.business_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Operational info already exists for this business")

    # Instantiate and save the new operational record [cite: 67]
    new_info = models.OperationalInfo(**data.model_dump())
    db.add(new_info)
    db.commit()
    db.refresh(new_info)
    return new_info

@router.get("/by-business/{business_id}", response_model=OperationalInfoOut)
def get_operational_info_by_business(business_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieves the operational configuration for a specific business profile.
    Commonly used for displaying hours and facility notes on public-facing pages[cite: 67].
    """
    info = db.query(models.OperationalInfo).filter_by(business_id=business_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Operational info not found")
    return info

@router.patch("/by-business/{business_id}", response_model=OperationalInfoOut)
def update_operational_info_by_business(business_id: UUID, data: OperationalInfoCreate, db: Session = Depends(get_db)):
    """
    Updates operational details using a partial update (PATCH) pattern.
    Reflects changes in business hours or availability across the platform[cite: 67, 68].
    """
    info = db.query(models.OperationalInfo).filter_by(business_id=business_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Operational info not found")

    # Iterate through the provided data model to apply updates to the existing record [cite: 68]
    for key, value in data.model_dump().items():
        setattr(info, key, value)

    db.commit()
    db.refresh(info)
    return info

@router.delete("/by-business/{business_id}", response_model=dict)
def delete_operational_info_by_business(business_id: UUID, db: Session = Depends(get_db)):
    """
    Permanently removes the operational information record for a business[cite: 68].
    """
    info = db.query(models.OperationalInfo).filter_by(business_id=business_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Operational info not found")

    db.delete(info)
    db.commit()
    return {"detail": "Operational info deleted"}