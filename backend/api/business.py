from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.business import BusinessCreate, BusinessOut, BusinessUpdate, BusinessDirectoryView
from uuid import UUID
from typing import List
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/business", tags=["Business"])

# In-memory caching layer to optimize performance for the public directory.
# This reduces database overhead by storing frequently accessed data.
DIRECTORY_CACHE = {
    "data": None,
    "expires_at": datetime.now(timezone.utc)
}
CACHE_TTL_SECONDS = 300 

@router.get("/directory-view", response_model=List[BusinessDirectoryView])
def get_directory_aggregated(db: Session = Depends(get_db)):
    """
    Fetches an aggregated view of all businesses including nested relationships.
    Implements a Time-To-Live (TTL) cache strategy to ensure high availability 
    and low latency for the main directory page.
    """
    global DIRECTORY_CACHE
    now = datetime.now(timezone.utc)
    
    # Check if a valid cache exists to avoid redundant database queries
    if DIRECTORY_CACHE["data"] and now < DIRECTORY_CACHE["expires_at"]:
        return DIRECTORY_CACHE["data"]

    # Database query for all business profiles if cache is expired or empty
    businesses = db.query(models.BusinessProfile).all()
    results = []

    # Perform server-side aggregation to bundle related data (hours, media, services, coupons)
    # into a single response object for the frontend.
    for biz in businesses:
        op_info = db.query(models.OperationalInfo).filter_by(business_id=biz.business_id).first()
        media = db.query(models.MediaAsset).filter_by(business_id=biz.business_id).limit(1).all()
        services = db.query(models.Service).filter_by(business_id=biz.business_id).all()
        coupons = db.query(models.Coupon).filter_by(business_id=biz.business_id).all()
        
        biz.operational_info = op_info
        biz.media = media
        biz.services = services
        biz.coupons = coupons
        
        results.append(biz)
        
    # Update the global cache with the newly aggregated result set
    DIRECTORY_CACHE["data"] = results
    DIRECTORY_CACHE["expires_at"] = now + timedelta(seconds=CACHE_TTL_SECONDS)
    
    return results

@router.post("/", response_model=BusinessOut)
def create_business(data: BusinessCreate, db: Session = Depends(get_db)):
    # Verify the owner exists to maintain relational data integrity
    owner = db.query(models.User).filter_by(user_id=data.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")

    new_business = models.BusinessProfile(**data.model_dump())
    db.add(new_business)
    db.commit()
    db.refresh(new_business)

    # Manual Cache Invalidation: Ensures new records are reflected in the directory immediately
    global DIRECTORY_CACHE
    DIRECTORY_CACHE["data"] = None 

    return new_business

@router.get("/", response_model=List[BusinessOut])
def list_businesses(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    # Standard paginated retrieval of business profiles ordered by creation date
    businesses = (
        db.query(models.BusinessProfile)
        .order_by(models.BusinessProfile.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return businesses

@router.get("/{business_id}", response_model=BusinessOut)
def get_business(business_id: UUID, db: Session = Depends(get_db)):
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@router.get("/by-owner/{owner_id}", response_model=BusinessOut)
def get_business_by_owner(owner_id: UUID, db: Session = Depends(get_db)):
    business = db.query(models.BusinessProfile).filter_by(owner_id=owner_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@router.patch("/{business_id}", response_model=BusinessOut)
def update_business(business_id: UUID, payload: BusinessUpdate, db: Session = Depends(get_db)):
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Apply partial updates only to the fields provided in the request payload
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(business, field, value)

    # Update timestamp using timezone-aware UTC for global consistency
    business.updated = datetime.now(timezone.utc)
      
    db.commit()
    db.refresh(business)

    # Invalidate directory cache to force a fresh data fetch on the next request
    global DIRECTORY_CACHE
    DIRECTORY_CACHE["data"] = None

    return business