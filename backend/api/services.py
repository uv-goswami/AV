from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.services import ServiceCreate, ServiceOut, ServiceUpdate
from uuid import UUID
from typing import List
from datetime import datetime

# API Router for managing individual business service offerings
router = APIRouter(prefix="/services", tags=["Services"])

@router.post("/", response_model=ServiceOut)
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    """
    Registers a new service under a specific business profile.
    Validates that the parent business exists before committing to the database.
    """
    # Referential integrity check: verify the business profile exists
    business = db.query(models.BusinessProfile).filter_by(business_id=data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Map schema data to the SQLAlchemy model and persist the record
    new_service = models.Service(**data.model_dump())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: UUID, db: Session = Depends(get_db)):
    """Retrieves a single service record by its unique identifier."""
    service = db.query(models.Service).filter_by(service_id=service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.get("/", response_model=List[ServiceOut])
def list_services(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Fetches a paginated list of services associated with a specific business.
    Ordered by creation date to display the newest offerings first.
    """
    services = (
        db.query(models.Service)
        .filter_by(business_id=business_id)
        .order_by(models.Service.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return services

@router.patch("/{service_id}", response_model=ServiceOut)
def update_service(service_id: UUID, payload: ServiceUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing service record using a partial update (PATCH) strategy.
    Only modifies fields explicitly provided in the request payload.
    """
    service = db.query(models.Service).filter_by(service_id=service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Apply updates dynamically from the model payload, skipping unset fields
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}", response_model=dict)
def delete_service(service_id: UUID, db: Session = Depends(get_db)):
    """Permanently removes a service record from the database."""
    service = db.query(models.Service).filter_by(service_id=service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    db.delete(service)
    db.commit()
    return {"detail": "Service deleted"}