from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.media import MediaOut
from uuid import UUID, uuid4
from typing import List
import os
from datetime import datetime

# Router for handling business media assets including images, videos, and documents [cite: 57]
router = APIRouter(prefix="/media", tags=["Media"])

# Define the local directory for physical file storage [cite: 58]
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configuration for supported file formats categorized by media type [cite: 58]
ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".gif"],
    "video": [".mp4", ".mov", ".avi", ".mkv"],
    "document": [".pdf", ".doc", ".docx", ".txt"]
}

# Enforce a global file size limit to prevent server storage abuse (50 MB) [cite: 58]
MAX_FILE_SIZE = 50 * 1024 * 1024 

def validate_file(media_type: str, filename: str, file_size: int):
    """
    Security helper to validate incoming files against allowed types and size constraints. [cite: 58]
    """
    ext = os.path.splitext(filename)[1].lower()
    
    # Check if the requested media category is supported [cite: 58, 59]
    if media_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid media type")
    
    # Verify the file extension matches the expected media type [cite: 59, 60]
    if ext not in ALLOWED_EXTENSIONS[media_type]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}' for {media_type}. Allowed: {ALLOWED_EXTENSIONS[media_type]}"
        )
    
    # Validate that the file size is within the allowed threshold [cite: 60]
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max allowed size is {MAX_FILE_SIZE // (1024*1024)} MB"
        )

@router.post("/upload", response_model=MediaOut)
def upload_media_file(
    business_id: UUID = Form(...),
    media_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Handles multi-part form data uploads for business assets. [cite: 60]
    Performs physical file storage and records the relative URL in the database. [cite: 61, 62]
    """
    # Ensure the target business profile exists 
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Read binary content to determine accurate file size for validation 
    file_bytes = file.file.read()
    file_size = len(file_bytes)

    # Run security and format validations 
    validate_file(media_type, file.filename, file_size)

    # Generate a unique filename using UUID to prevent collisions or overwriting existing files 
    filename = f"{uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Persist the file to the local storage directory 
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Log asset metadata and access URL in the database [cite: 62]
    new_media = models.MediaAsset(
        business_id=business_id,
        media_type=media_type,
        url=f"/uploads/{filename}",
        alt_text=None,
        uploaded_at=datetime.utcnow()
    )
    db.add(new_media)
    db.commit()
    db.refresh(new_media)
    return new_media

@router.get("/{media_id}", response_model=MediaOut)
def get_media(media_id: UUID, db: Session = Depends(get_db)):
    """Retrieves metadata for a specific media asset by ID [cite: 62]"""
    media = db.query(models.MediaAsset).filter_by(asset_id=media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media

@router.get("/", response_model=List[MediaOut])
def list_media(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of all media assets belonging to a business. [cite: 63]
    Assets are ordered by upload date (most recent first). [cite: 63]
    """
    return (
        db.query(models.MediaAsset)
        .filter_by(business_id=business_id)
        .order_by(models.MediaAsset.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.delete("/{media_id}", response_model=dict)
def delete_media(media_id: UUID, db: Session = Depends(get_db)):
    """
    Removes the database record for a specific media asset. [cite: 64]
    Note: In a production environment, this would typically trigger a cleanup of the physical file. [cite: 64]
    """
    media = db.query(models.MediaAsset).filter_by(asset_id=media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    db.delete(media)
    db.commit()
    return {"detail": "Media deleted"}