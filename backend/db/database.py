from sqlalchemy import create_engine, event, DDL
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables from the .env file for secure configuration management
load_dotenv()

# Retrieve the database connection string from environment variables
# This allows the app to switch between local SQLite/PostgreSQL and production databases easily
DATABASE_URL = os.getenv("DATABASE_URL")

# Initialize the SQLAlchemy engine. The engine handles the connection pool 
# and translates Python code into database-specific SQL commands.
engine = create_engine(DATABASE_URL)

# Create a base class for all database models to inherit from
# This allows SQLAlchemy to map Python classes to database tables
Base = declarative_base()

# AUTOMATION: ENABLE CITEXT EXTENSION 
# We use SQLAlchemy's DDL (Data Definition Language) system to ensure 
# the extension is created before the tables are.
# "IF NOT EXISTS" prevents errors on subsequent runs.
event.listen(
    Base.metadata,
    "before_create",
    DDL("CREATE EXTENSION IF NOT EXISTS citext").execute_if(dialect="postgresql")
)

# Configure the session factory. 
# autocommit=False ensures transactions are explicitly controlled for data integrity.
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)



def get_db():
    """
    Dependency function to provide a database session to FastAPI routes.
    Implements a generator pattern to ensure that the session is properly 
    opened before the request and closed immediately after, preventing memory leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # Guarantee session closure regardless of whether the request succeeded or failed
        db.close()