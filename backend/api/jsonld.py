import json
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import models
from db.database import get_db
from schemas.jsonld import JsonLDFeedOut

# Router specialized in generating and managing Schema.org JSON-LD feeds
# This is a key component for improving SEO and visibility for AI-driven search engines
router = APIRouter(prefix="/jsonld", tags=["JSON-LD"])

@router.post("/generate", response_model=JsonLDFeedOut)
def generate_jsonld(business_id: UUID = Query(...), db: Session = Depends(get_db)):
    """
    Automated JSON-LD Generator:
    Synthesizes data from multiple tables (Business, Services, Coupons, Media, Operational Info)
    and merges it with AI-generated metadata to create a comprehensive Schema.org structured data feed.
    """
    
    # 1. Primary Data Retrieval: Fetch the core business profile [cite: 42]
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # 2. Supporting Data Aggregation: Collect all related business entities [cite: 42, 43]
    services = db.query(models.Service).filter_by(business_id=business_id).all()
    coupons = db.query(models.Coupon).filter_by(business_id=business_id, is_active=True).all()
    media = db.query(models.MediaAsset).filter_by(business_id=business_id).all()
    info = db.query(models.OperationalInfo).filter_by(business_id=business_id).first()
    
    # 3. Hybrid Integration: Incorporate AI-generated keywords and marketing insights [cite: 43]
    ai_meta = db.query(models.AiMetadata).filter_by(business_id=business_id).first()

    # 4. Schema Mapping: Translate internal business types to valid Schema.org vocabulary [cite: 43, 44]
    schema_type_map = {
        "restaurant": "Restaurant",
        "salon": "HairSalon",
        "clinic": "MedicalClinic",
        "bakery": "Bakery",
        "gym": "ExerciseGym",
        "cafe": "Cafe"
    }
    # Fallback to 'LocalBusiness' as a generic safe default [cite: 44]
    schema_type = schema_type_map.get((business.business_type or "").lower(), "LocalBusiness")

    # 5. Dynamic Description Building: Enhance official descriptions with AI hooks [cite: 44]
    final_description = business.description or ""
    if ai_meta and ai_meta.extracted_insights:
        final_description += f" - {ai_meta.extracted_insights}"

    # 6. Structured Data Construction: Build the JSON-LD dictionary following industry standards [cite: 44, 45, 46, 47]
    jsonld = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "name": business.name,
        "description": final_description,
        "keywords": ai_meta.keywords if ai_meta else "",  # Inject AI-discovered keywords [cite: 45]
        "url": f"https://aivault.com/business/{business_id}",
        "telephone": business.phone,
        "address": {
            "@type": "PostalAddress", 
            "streetAddress": business.address or "Not listed",
            "addressCountry": "IN"
        },
        # Geographical data helps search engines pin the business location accurately [cite: 46]
        "geo": {
            "@type": "GeoCoordinates", 
            "latitude": business.latitude, 
            "longitude": business.longitude
        } if business.latitude and business.longitude else None,
        "priceRange": "$$"
    }

    # Conditional Field Injection: Add Image Data if assets exist [cite: 47]
    image_url = next((m.url for m in media if m.media_type == "image"), None)
    if image_url:
        jsonld["image"] = image_url

    # Conditional Field Injection: Format Opening Hours for Schema compliance [cite: 47, 50]
    if info:
        days = "Mo-Su" 
        jsonld["openingHours"] = f"{days} {info.opening_hours}-{info.closing_hours}"

    # Service Offering Mapping: Convert internal services into 'Offer' objects [cite: 50, 51, 52]
    if services:
        jsonld["makesOffer"] = [
            {
                "@type": "Offer", 
                "itemOffered": {
                    "@type": "Service", 
                    "name": s.name,
                    "description": s.description
                }, 
                "price": str(s.price),
                "priceCurrency": "INR"
            }
            for s in services
        ]

    # Promotional Data Mapping: Include active coupons as valid Schema Offers [cite: 52, 53]
    if coupons:
        jsonld["hasCoupon"] = [
            {
                "@type": "Offer", 
                "discountCode": c.code, 
                "description": c.description,
                "validThrough": c.valid_until.isoformat() if c.valid_until else None
            }
            for c in coupons
        ]

    # Clean the payload by removing null keys to maintain a clean JSON structure [cite: 53, 54]
    jsonld = {k: v for k, v in jsonld.items() if v is not None}

    # 7. Persistence: Save the generated feed to the database for archival and retrieval 
    feed = models.JsonLDFeed(
        business_id=business_id,
        schema_type=schema_type,
        jsonld_data=json.dumps(jsonld),
        is_valid=True,
        validation_errors=None,
        generated_at=datetime.utcnow(),
    )
    db.add(feed)
    db.commit()
    db.refresh(feed)
    return feed

@router.get("/", response_model=List[JsonLDFeedOut])
def list_jsonld(business_id: UUID = Query(...), db: Session = Depends(get_db)):
    """Retrieves all generated JSON-LD history for a specific business, newest first""" [cite: 54, 55]
    return (
        db.query(models.JsonLDFeed)
        .filter_by(business_id=business_id)
        .order_by(models.JsonLDFeed.generated_at.desc())
        .all()
    )

@router.get("/{feed_id}", response_model=JsonLDFeedOut)
def get_jsonld(feed_id: UUID, db: Session = Depends(get_db)):
    """Fetches a specific JSON-LD feed by its primary key""" [cite: 55]
    feed = db.query(models.JsonLDFeed).filter_by(feed_id=feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="JSON-LD feed not found")
    return feed

@router.delete("/{feed_id}")
def delete_jsonld(feed_id: UUID, db: Session = Depends(get_db)):
    """Removes a generated feed record from the database""" [cite: 55, 56]
    feed = db.query(models.JsonLDFeed).filter_by(feed_id=feed_id).first()
    if not feed:
        raise HTTPException(status_code=404, detail="JSON-LD feed not found")
    
    db.delete(feed)
    db.commit()
    return {"message": "Feed deleted successfully"}