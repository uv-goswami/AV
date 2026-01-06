from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.coupons import CouponCreate, CouponOut, CouponUpdate
from uuid import UUID
from typing import List

# Define the router for coupon management under the /coupons prefix
router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.post("/", response_model=CouponOut)
def create_coupon(data: CouponCreate, db: Session = Depends(get_db)):
    """
    Creates a new promotional coupon for a specific business.
    Validates the existence of the business profile before persisting the coupon record.
    """
    # Verify that the business exists to ensure referential integrity
    business = db.query(models.BusinessProfile).filter_by(business_id=data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Initialize new Coupon instance using the provided schema data
    new_coupon = models.Coupon(**data.model_dump())
    
    # Save the record to the database and return the refreshed object
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return new_coupon

@router.get("/{coupon_id}", response_model=CouponOut)
def get_coupon(coupon_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieves detailed information for a single coupon based on its unique identifier.
    Returns a 404 error if the coupon does not exist in the system.
    """
    coupon = db.query(models.Coupon).filter_by(coupon_id=coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon

@router.get("/", response_model=List[CouponOut])
def list_coupons(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Fetches a paginated list of coupons associated with a specific business.
    Results are ordered by their expiration date to show the most recently valid offers first.
    """
    return (
        db.query(models.Coupon)
        .filter_by(business_id=business_id)
        .order_by(models.Coupon.valid_until.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.patch("/{coupon_id}", response_model=CouponOut)
def update_coupon(coupon_id: UUID, data: CouponUpdate, db: Session = Depends(get_db)):
    """
    Updates specific fields of an existing coupon.
    Uses partial updates (PATCH) to modify only the fields provided in the request body.
    """
    # Locate existing record
    coupon = db.query(models.Coupon).filter_by(coupon_id=coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    # Extract only the fields that were explicitly set in the request to prevent overwriting with defaults
    update_data = data.model_dump(exclude_unset=True)
    
    # Map the update data onto the existing database model instance
    for key, value in update_data.items():
        setattr(coupon, key, value)

    # Commit changes and return the updated record
    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}", response_model=dict)
def delete_coupon(coupon_id: UUID, db: Session = Depends(get_db)):
    """
    Permanently removes a coupon from the database.
    Performs a check to confirm the coupon exists before attempting deletion.
    """
    coupon = db.query(models.Coupon).filter_by(coupon_id=coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    # Delete the record and finalize the transaction
    db.delete(coupon)
    db.commit()
    return {"detail": "Coupon deleted"}