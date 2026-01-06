import os
import json
import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel, HttpUrl
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from schemas.visibility import (
    VisibilityCheckRequestCreate,
    VisibilityCheckRequestOut,
    VisibilityCheckResultCreate,
    VisibilityCheckResultOut,
    VisibilitySuggestionCreate,
    VisibilitySuggestionOut
)
from uuid import UUID
from typing import List
from datetime import datetime

# Initialize the Gemini Generative AI model for automated SEO auditing
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter(prefix="/visibility", tags=["Visibility"])

def ensure_string(value):
    """
    Utility to normalize AI output. Converts list-based recommendations 
    or issues into a semicolon-separated string for structured storage.
    """
    if isinstance(value, list):
        return "; ".join(str(v) for v in value) 
    return str(value) if value is not None else ""

# -------------------------
# INTERNAL AUDIT MANAGEMENT (CRUD)
# -------------------------

@router.post("/check", response_model=VisibilityCheckRequestOut)
def create_check_request(data: VisibilityCheckRequestCreate, db: Session = Depends(get_db)):
    """Logs a new request to perform a visibility audit on a business profile."""
    business = db.query(models.BusinessProfile).filter_by(business_id=data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    new_check = models.VisibilityCheckRequest(**data.model_dump())
    db.add(new_check)
    db.commit()
    db.refresh(new_check)
    return new_check

@router.get("/check", response_model=List[VisibilityCheckRequestOut])
def list_check_requests(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieves a history of visibility check requests for a specific business."""
    return (
        db.query(models.VisibilityCheckRequest)
        .filter_by(business_id=business_id)
        .order_by(models.VisibilityCheckRequest.requested_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.get("/result", response_model=List[VisibilityCheckResultOut])
def list_results(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Fetches the actual audit scores and findings for a business profile."""
    return (
        db.query(models.VisibilityCheckResult)
        .filter_by(business_id=business_id)
        .order_by(models.VisibilityCheckResult.completed_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.get("/suggestion", response_model=List[VisibilitySuggestionOut])
def list_suggestions(
    business_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieves AI-suggested actionable improvements to boost visibility scores."""
    return (
        db.query(models.VisibilitySuggestion)
        .filter_by(business_id=business_id)
        .order_by(models.VisibilitySuggestion.suggested_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

# -------------------------
# CORE ENGINE: AI VISIBILITY AUDITOR
# -------------------------

@router.post("/run", response_model=VisibilityCheckResultOut)
def run_visibility(business_id: UUID = Query(...), db: Session = Depends(get_db)):
    """
    Internal Visibility Engine:
    Performs a deep audit of the local business profile. It checks for critical 
    SEO components like JSON-LD, image counts, and service details.
    The collected data is analyzed by Gemini to generate a harsh visibility score 
    from the perspective of both human users and AI search agents.
    """
    # 1. Collate profile data for auditing
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    services = db.query(models.Service).filter_by(business_id=business_id).all()
    media_count = db.query(models.MediaAsset).filter_by(business_id=business_id).count()
    op_info = db.query(models.OperationalInfo).filter_by(business_id=business_id).first()
    jsonld_exists = db.query(models.JsonLDFeed).filter_by(business_id=business_id).count() > 0

    # 2. Record the audit request
    check = models.VisibilityCheckRequest(
        business_id=business_id,
        check_type="visibility", 
        input_data=f"Services: {len(services)}, Media: {media_count}, JSON-LD: {jsonld_exists}",
        requested_at=datetime.utcnow()
    )
    db.add(check)
    db.commit()

    # 3. Construct an expert SEO auditor prompt
    s_names = [s.name for s in services if s.name]
    services_str = ", ".join(s_names) if s_names else "None"
    
    prompt = f"""
    Act as a Strict SEO Auditor. Grade this business profile for visibility to AI Agents and Humans.
    DATA: {business.name}, Services: {len(services)}, Images: {media_count}, JSON-LD: {jsonld_exists}.
    Base score is 0. Deduct points for missing schema, few images, or short descriptions.
    Return JSON with score, bot_analysis, human_analysis, issues, and recommendations.
    """

    try:
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # Parse and sanitize the AI response
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        if not clean_text:
            raise ValueError("Empty AI response received")

        ai_data = json.loads(clean_text)

        # Structure the findings for database persistence
        result = models.VisibilityCheckResult(
            request_id=check.request_id,
            business_id=business_id,
            visibility_score=float(ai_data.get("score", 0)),
            issues_found=ensure_string(ai_data.get("issues", [])),
            recommendations=f"[BOTS]: {ai_data.get('bot_analysis')} || [HUMANS]: {ai_data.get('human_analysis')} || ACTIONS: {ensure_string(ai_data.get('recommendations'))}", 
            output_snapshot=clean_text[:500],
            completed_at=datetime.utcnow()
        )

        db.add(result)
        db.commit()
        db.refresh(result)
        return result

    except Exception as e:
        # Fallback Logic: Perform a hard-coded heuristic audit if the AI service is unavailable
        print(f"❌ AI VISIBILITY CHECK FAILED: {str(e)}")
        
        strict_score = 0
        issues = [f"AI Error: {str(e)}"]
        recs = ["Check API Quota"]

        if jsonld_exists: strict_score += 30
        if len(services) > 0: strict_score += 20
        if media_count >= 3: strict_score += 20
        if business.description and len(business.description) >= 50: strict_score += 10

        result = models.VisibilityCheckResult(
            request_id=check.request_id,
            business_id=business_id,
            visibility_score=min(strict_score, 50),
            issues_found="; ".join(issues),
            recommendations="; ".join(recs),
            completed_at=datetime.utcnow()
        )
        db.add(result)
        db.commit()
        return result

# -------------------------
# EXTERNAL WEB AUDITOR
# -------------------------

class ExternalAuditRequest(BaseModel):
    url: HttpUrl

@router.post("/external")
def audit_external_site(data: ExternalAuditRequest):
    """
    Public Website Auditor:
    Scrapes a live external website to analyze its basic SEO health.
    Extracts Meta titles, descriptions, H1 tags, and checks for JSON-LD scripts.
    """
    try:
        headers = {'User-Agent': 'AiVault-Auditor/1.0'}
        response = requests.get(str(data.url), headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Perform DOM analysis for key SEO elements
        title = soup.title.string if soup.title else "Missing Title"
        desc_tag = soup.find("meta", attrs={"name": "description"})
        description = desc_tag["content"] if desc_tag else "Missing Description"
        
        h1_count = len(soup.find_all('h1'))
        img_count = len(soup.find_all('img'))
        json_ld_found = soup.find('script', type='application/ld+json') is not None
        raw_text = soup.get_text(separator=' ', strip=True)[:3000] 

    except Exception as e:
        return {
            "error": f"Scrape Failed: {str(e)}",
            "score": 0,
            "bot_analysis": "Unreachable",
            "recommendations": ["Check URL", "Ensure site allows crawlers"]
        }

    # Utilize AI to analyze the scraped DOM data for AI search engine compatibility
    prompt = f"Analyze website SEO: URL {data.url}, Title {title}, Description {description}, JSON-LD {json_ld_found}. Grade 0-100."

    try:
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception as e:
        return {"error": "AI Analysis Failed", "details": str(e)}