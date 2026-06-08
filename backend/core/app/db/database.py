from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback for local development if DATABASE_URL is not set
# This ensures the app doesn't crash, but analytics will return 0/empty
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or "postgresql://postgres:postgres@localhost:5432/postgres"

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        # Pool configuration for production stability and performance
        pool_size=10,  # Increased from 5 to 10 for better concurrency
        max_overflow=20,  # Increased from 10 to 20 for peak load handling
        pool_timeout=30,
        pool_recycle=1800,  # Recycle connections every 30 minutes
        pool_pre_ping=True,  # Verify connections before using them
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"Failed to initialize SQLAlchemy engine: {e}")
    # Create a dummy sessionmaker that will fail on use but allow import
    SessionLocal = None

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a SQLAlchemy database session.
    Used in analytics routes for complex aggregations.
    """
    if SessionLocal is None:
        logger.error("SessionLocal is not initialized. Database connection might be missing.")
        raise Exception("Database connection not initialized")
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
