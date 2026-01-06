from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from fastapi.staticfiles import StaticFiles
from api import (
    auth,
    users,
    business,
    services,
    ai_metadata,
    coupons,
    media,
    visibility,
    jsonld,
    operational_info,
    public
)

# Database Initialization: Synchronize SQLAlchemy models with the database.
# This ensures all necessary tables exist before the application starts accepting requests.
Base.metadata.create_all(bind=engine)

# Initialize the core FastAPI application instance with metadata for documentation
app = FastAPI(
    title="AiVault Backend",
    description="Modular backend for business profiles, services, media, and AI metadata",
    version="1.0.0"
)

# CORS (Cross-Origin Resource Sharing) Middleware:
# Configured to allow the React/Frontend application to communicate with this API 
# regardless of the domain/port it is hosted on.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modular Routing:
# Each router represents a specific domain of the application. 
# This approach keeps the main entry point clean and maintainable.
app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(ai_metadata.router)
app.include_router(business.router)
app.include_router(coupons.router)
app.include_router(media.router)
app.include_router(services.router)
app.include_router(visibility.router)
app.include_router(jsonld.router)
app.include_router(public.router)
app.include_router(operational_info.router, prefix="/operational-info", tags=["Operational Info"])

# Static File Mounting:
# Exposes the local 'uploads' directory via a URL path (/uploads).
# This allows the frontend to retrieve and display business media assets.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Root Endpoint: Serves as a basic health check for system monitoring and deployment verification.
@app.get("/")
def read_root():
    return {"status": "AiVault backend is running"}