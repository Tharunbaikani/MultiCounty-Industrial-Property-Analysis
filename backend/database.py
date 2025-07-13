import sqlite3
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os

# Database configuration
DATABASE_URL = "sqlite:///./starboard_properties.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
Base = declarative_base()


class Property(Base):
    __tablename__ = "properties"
    
    id = Column(String, primary_key=True, index=True)
    county_id = Column(String, index=True)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    
    # Property details
    property_type = Column(String)
    zoning_code = Column(String)
    building_area = Column(Float)  # Square feet
    lot_area = Column(Float)  # Square feet
    year_built = Column(Integer)
    
    # Financial data
    assessed_value = Column(Float)
    market_value = Column(Float)
    sale_price = Column(Float)
    sale_date = Column(DateTime)
    
    # Location data
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Metadata
    data_source = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow)
    raw_data = Column(JSON)  # Store original API response
    
    # Data quality flags
    is_verified = Column(Boolean, default=False)
    quality_score = Column(Float)  # 0-1 score
    outlier_flags = Column(JSON)  # List of outlier indicators


class ExtractionLog(Base):
    __tablename__ = "extraction_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    county_id = Column(String, index=True)
    extraction_date = Column(DateTime, default=datetime.utcnow)
    
    # Results
    records_found = Column(Integer)
    records_processed = Column(Integer)
    records_saved = Column(Integer)
    errors_count = Column(Integer)
    
    # Status
    status = Column(String)  # SUCCESS, FAILED, PARTIAL
    error_details = Column(JSON)
    
    # Performance
    execution_time = Column(Float)  # seconds
    api_calls_made = Column(Integer)


# Database initialization
async def init_db():
    """Initialize the database and create tables"""
    Base.metadata.create_all(bind=engine)
    
    # Since we're using ATTOM API exclusively, we don't need individual county API configurations
    # The system now gets all data from ATTOM API with unified field mapping
    
    print("Database initialized for ATTOM API integration")


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper functions
def log_extraction(county_id: str, records_found: int, records_processed: int, 
                  records_saved: int, errors_count: int, status: str, 
                  execution_time: float, api_calls_made: int, error_details: dict = None):
    """Log extraction results"""
    db = SessionLocal()
    try:
        log_entry = ExtractionLog(
            county_id=county_id,
            records_found=records_found,
            records_processed=records_processed,
            records_saved=records_saved,
            errors_count=errors_count,
            status=status,
            execution_time=execution_time,
            api_calls_made=api_calls_made,
            error_details=error_details
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error logging extraction: {e}")
    finally:
        db.close() 