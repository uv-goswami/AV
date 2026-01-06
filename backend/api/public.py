from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from db.database import get_db
from db import models
from uuid import UUID
from datetime import datetime

# Router for public-facing SEO pages designed to be indexed by search engines and AI crawlers
router = APIRouter(prefix="/public", tags=["Public SEO Pages"])

# 1. DYNAMIC SITEMAP: The roadmap for search engine bots
@router.get("/sitemap.xml", response_class=Response)
def generate_sitemap(request: Request, db: Session = Depends(get_db)):
    """
    Generates a dynamic XML sitemap to help search engines discover and index all 
    business profiles. It uses the request's base URL to ensure compatibility 
    across local development and production environments.
    """
    base_url = str(request.base_url).rstrip("/") + "/public/business"
    
    # Retrieve all profiles to populate the sitemap
    businesses = db.query(models.BusinessProfile).all()
    
    xml_content = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_content.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Prioritize the directory hub as the main entry point
    xml_content.append(f"""
    <url>
        <loc>{str(request.base_url).rstrip("/")}/public/directory</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    """)
    
    # Add individual business URLs with metadata for crawl frequency and priority
    for b in businesses:
        xml_content.append(f"""
        <url>
            <loc>{base_url}/{b.business_id}</loc>
            <lastmod>{datetime.utcnow().strftime('%Y-%m-%d')}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
        </url>
        """)
    
    xml_content.append('</urlset>')
    return Response(content="".join(xml_content), media_type="application/xml")

# 2. STATIC DIRECTORY: A crawlable hub for all businesses
@router.get("/directory", response_class=HTMLResponse)
def get_public_directory(request: Request, db: Session = Depends(get_db)):
    """
    Provides a simple, high-performance HTML directory of all registered businesses.
    This serves as an internal linking hub, passing "link equity" to individual 
    business pages for better search ranking.
    """
    businesses = db.query(models.BusinessProfile).all()
    
    list_items = []
    for b in businesses:
        link = f"/public/business/{b.business_id}"
        # Truncate description to provide a clean snippet for search results
        desc = (b.description[:100] + "...") if (b.description and len(b.description) > 100) else (b.description or "No description")
        
        list_items.append(f"""
            <li style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <a href="{link}" style="font-size: 1.2em; font-weight: bold; text-decoration: none; color: #007bff;">{b.name}</a>
                <div style="color: #666; font-size: 0.9em;">{b.business_type} • {b.address or 'Online'}</div>
                <p style="margin: 5px 0 0 0; color: #333;">{desc}</p>
            </li>
        """)
    
    # Basic semantic HTML structure for optimal bot readability
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>AiVault Business Directory</title>
        <meta name="description" content="Browse local businesses optimized for AI visibility on AiVault.">
    </head>
    <body style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1>AiVault Directory</h1>
        <p>Index of all registered businesses.</p>
        <ul style="list-style: none; padding: 0;">
            {"".join(list_items)}
        </ul>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

# 3. INDIVIDUAL BUSINESS MIRROR: The SEO-optimized landing page
@router.get("/business/{business_id}", response_class=HTMLResponse)
def get_business_seo_page(business_id: UUID, db: Session = Depends(get_db)):
    """
    Generates a server-side rendered (SSR) mirror of the business profile.
    This page is heavily optimized with Meta tags, Open Graph data, and 
    JSON-LD scripts to ensure the business is highly visible to both 
    traditional search engines (Google) and AI agents (ChatGPT/Perplexity).
    """
    business = db.query(models.BusinessProfile).filter_by(business_id=business_id).first()
    if not business:
        return HTMLResponse(content="<h1>Business not found</h1>", status_code=404)

    # Gather all relevant business data for a complete page representation
    services = db.query(models.Service).filter_by(business_id=business_id).all()
    media = db.query(models.MediaAsset).filter_by(business_id=business_id).all()
    json_feed = db.query(models.JsonLDFeed).filter_by(business_id=business_id).first()
    
    title = f"{business.name} - {business.business_type}"
    desc = business.description or "View this business profile on AiVault."
    image_url = next((m.url for m in media if m.media_type == "image"), "")
    
    # Transform database service records into semantic HTML list items
    services_html = "".join([
        f"<li class='service-item'><strong>{s.name}</strong> <span class='price'>${s.price}</span><p>{s.description}</p></li>" 
        for s in services
    ])

    # Inject the pre-generated JSON-LD structured data into the page head
    json_ld_script = json_feed.jsonld_data if json_feed else "{}"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <meta name="description" content="{desc}">
        <meta property="og:image" content="{image_url}">
        
        <script type="application/ld+json">
        {json_ld_script}
        </script>

        <style>
            :root {{ --primary: #007bff; --bg: #f8f9fa; --text: #333; }}
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); margin: 0; padding: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
            header {{ border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }}
            h1 {{ margin: 0 0 10px 0; color: #111; font-size: 2.5rem; }}
            .badges {{ display: flex; gap: 10px; margin-bottom: 15px; }}
            .tag {{ background: #e9ecef; color: #555; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }}
            .hero-img {{ width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-top: 20px; }}
            h2 {{ color: #444; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 40px; }}
            ul {{ list-style: none; padding: 0; }}
            .service-item {{ padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px; }}
            .price {{ float: right; font-weight: bold; color: var(--primary); }}
            .cta-box {{ text-align: center; margin-top: 50px; padding: 30px; background: #e3f2fd; border-radius: 8px; }}
            .btn {{ display: inline-block; background: var(--primary); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background 0.2s; }}
            .btn:hover {{ background: #0056b3; }}
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="badges">
                    <span class="tag">{business.business_type}</span>
                    <span class="tag">{business.address or 'Online'}</span>
                </div>
                <h1>{business.name}</h1>
                <p>{desc}</p>
                {f'<img src="{image_url}" class="hero-img" alt="{business.name}">' if image_url else ''}
            </header>

            <main>
                <h2>Services</h2>
                <ul>
                    {services_html if services else '<li>No specific services listed yet.</li>'}
                </ul>
                
                <h2>Contact</h2>
                <p><strong>Phone:</strong> {business.phone or 'N/A'}</p>
                <p><strong>Website:</strong> <a href="{business.website}" target="_blank">{business.website}</a></p>

                <div class="cta-box">
                    <h3>Want to book an appointment?</h3>
                    <p>View the full interactive profile on our app.</p>
                    <a href="https://aivault-frontend.onrender.com/directory" class="btn">
                        Open in App
                    </a>
                </div>
            </main>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content, status_code=200)