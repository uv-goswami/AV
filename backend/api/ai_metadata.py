import os
import json
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.ai_metadata import AiMetadataCreate, AiMetadataOut
from uuid import UUID
from typing import List
from datetime import datetime

# Initialize Google Gemini AI with the project API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter(prefix="/ai-metadata", tags=["AI Metadata"])

def ensure_string(value):
    """
    Utility to ensure AI-generated data is stored as a clean string.
    Converts list outputs into comma-separated values for database consistency.
    """
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    return str(value) if value is not None else ""

@router.post("/", response_model=AiMetadataOut)
def create_metadata(data: AiMetadataCreate, db: Session = Depends(get_db)):
    # Verify the business exists before allowing manual metadata creation
    business = db.query(models.BusinessProfile).filter_by(business_id=data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    new_metadata = models.AiMetadata(**data.model_dump())
    db.add(new_metadata)
    db.commit()
    db.refresh(new_metadata)
    return new_metadata

@router.get("/", response_model=List[AiMetadataOut])
def list_metadata(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    # Fetch a paginated list of metadata entries for a specific business
    return (
        db.query(models.AiMetadata)
        .filter_by(business_id=business_id)
        .order_by(models.AiMetadata.generated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.get("/{metadata_id}", response_model=AiMetadataOut)
def get_metadata(metadata_id: UUID, db: Session = Depends(get_db)):
    metadata = db.query(models.AiMetadata).filter_by(ai_metadata_id=metadata_id).first()
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    return metadata

@router.delete("/{metadata_id}")
def delete_metadata(metadata_id: UUID, db: Session = Depends(get_db)):
    metadata = db.query(models.AiMetadata).filter_by(ai_metadata_id=metadata_id).first()
    if not metadata:
        raise HTTPException(status_code=404, detail="Metadata not found")
    
    db.delete(metadata)
    db.commit()
    return {"message": "Metadata deleted successfully"}

@router.post("/generate", response_model=AiMetadataOut)
def generate_metadata(business_id: UUID = Query(...), db: Session = Depends(get_db)):
    """
    Smart Metadata Generator:
    This endpoint aggregates business profile data, services, and operational info
    to feed into a Large Language Model (Gemini). It produces SEO-optimized
    keywords, marketing insights, and intent labels automatically.
    """
    
    # 1. Collate core business profile data
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # 2. Safely gather related offerings and service pricing for context
    services_list = []
    try:
        services_q = db.query(models.Service).filter_by(business_id=business_id).all()
        services_list = [f"{s.name} (${s.price})" for s in services_q]
    except Exception:
        pass 

    # 3. Include operational hours to improve local SEO accuracy
    op_info_str = "Not listed"
    try:
        op_info = db.query(models.OperationalInfo).filter_by(business_id=business_id).first()
        if op_info:
            op_info_str = f"Open: {op_info.opening_hours} - {op_info.closing_hours}, Off: {op_info.off_days}"
    except Exception:
        pass

    # 4. Construct the structured context for the AI model
    context_text = f"""
    Business Name: {business.name}
    Type: {business.business_type}
    Description: {business.description or 'No description provided.'}
    Slogan: {business.quote_slogan or 'None'}
    Offerings: {", ".join(services_list) if services_list else "General services"}
    """

    prompt = f"Analyze this business for SEO optimization: {context_text}. Generate keywords, pitch, intents, and entities in JSON."

    try:
        # Request generation from Gemini 2.5 Flash
        model = genai.GenerativeModel('gemini-2.5-flash') 
        response = model.generate_content(prompt)
        
        # Parse the JSON response and strip potential markdown formatting
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(clean_text)

        # Standardize AI output into comma-separated strings
        keywords_str = ensure_string(ai_data.get("keywords"))
        insights_str = ensure_string(ai_data.get("extracted_insights"))
        intents_str = ensure_string(ai_data.get("intent_labels"))
        entities_str = ensure_string(ai_data.get("detected_entities"))

        # Update existing record or create a new metadata entry
        existing_meta = db.query(models.AiMetadata).filter(models.AiMetadata.business_id == business_id).first()
        
        if existing_meta:
            existing_meta.keywords = keywords_str
            existing_meta.extracted_insights = insights_str
            existing_meta.intent_labels = intents_str
            existing_meta.detected_entities = entities_str
            existing_meta.generated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_meta)
            return existing_meta
        else:
            new_meta = models.AiMetadata(
                business_id=business_id,
                keywords=keywords_str,
                extracted_insights=insights_str,
                intent_labels=intents_str,
                detected_entities=entities_str,
                generated_at=datetime.utcnow(),
            )
            db.add(new_meta)
            db.commit()
            db.refresh(new_meta)
            return new_meta

    except Exception as e:
        # Standard error handling for external AI API failures
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")