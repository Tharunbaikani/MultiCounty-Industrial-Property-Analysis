from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PropertyType(str, Enum):
    INDUSTRIAL = "industrial"
    WAREHOUSE = "warehouse"
    MANUFACTURING = "manufacturing"
    DISTRIBUTION = "distribution"
    FLEX_SPACE = "flex_space"


class ZoningCode(str, Enum):
    M1 = "M1"
    M2 = "M2"
    M3 = "M3"
    I1 = "I-1"
    I2 = "I-2"
    I3 = "I-3"
    INDUSTRIAL = "INDUSTRIAL"
    MANUFACTURING = "MANUFACTURING"
    WAREHOUSE = "WAREHOUSE"


class PropertySearch(BaseModel):
    counties: List[str] = Field(..., description="List of county IDs to search")
    property_type: Optional[PropertyType] = Field(None, description="Type of property to search for")
    min_size: Optional[float] = Field(None, description="Minimum building area in square feet")
    max_size: Optional[float] = Field(None, description="Maximum building area in square feet")
    zoning_codes: Optional[List[str]] = Field(None, description="List of zoning codes to filter by")
    city: Optional[str] = Field(None, description="City name to filter by")
    max_year_built: Optional[int] = Field(None, description="Maximum year built")
    min_year_built: Optional[int] = Field(None, description="Minimum year built")
    max_assessed_value: Optional[float] = Field(None, description="Maximum assessed value")
    min_assessed_value: Optional[float] = Field(None, description="Minimum assessed value")


class PropertyResponse(BaseModel):
    id: str
    county_id: str
    address: str
    city: str
    state: str
    zip_code: Optional[str] = None
    
    # Property details
    property_type: Optional[str] = None
    zoning_code: Optional[str] = None
    building_area: Optional[float] = None  # Square feet
    lot_area: Optional[float] = None  # Square feet
    year_built: Optional[int] = None
    
    # Financial data
    assessed_value: Optional[float] = None
    market_value: Optional[float] = None
    sale_price: Optional[float] = None
    sale_date: Optional[datetime] = None
    
    # Location data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Metadata
    data_source: str
    last_updated: datetime
    quality_score: Optional[float] = None
    is_verified: bool = False
    outlier_flags: Optional[List[str]] = None


class ComparableProperty(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    property: PropertyResponse
    similarity_score: float = Field(..., description="Similarity score (0-1)")
    distance_miles: Optional[float] = Field(None, description="Distance in miles from target property")
    similarity_factors: Dict[str, float] = Field(..., description="Breakdown of similarity factors")
    confidence_score: float = Field(..., description="Confidence in this comparable (0-1)")


class ComparableResponse(BaseModel):
    target_property: PropertyResponse
    comparables: List[ComparableProperty]
    count: int
    search_criteria: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class APIStatus(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    county_id: str
    county_name: str
    is_active: bool
    last_tested: Optional[datetime] = None
    test_status: Optional[str] = None
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_hour: Optional[int] = None
    response_time_ms: Optional[float] = None


class ExtractionResult(BaseModel):
    county_id: str
    status: str
    records_found: int
    records_processed: int
    records_saved: int
    errors_count: int
    execution_time: float
    api_calls_made: int
    error_details: Optional[Dict[str, Any]] = None
    started_at: datetime
    completed_at: Optional[datetime] = None


class SimilarityFactors(BaseModel):
    """Factors used to calculate property similarity, now including sale price."""
    # Updated weights - sale price gets highest priority
    sale_price_weight: float = 0.35  # Highest weight for sale price
    size_weight: float = 0.25        # Second highest for building size
    value_weight: float = 0.20       # Third for assessed/market value
    location_weight: float = 0.10    # Reduced from 0.25 to 0.10
    age_weight: float = 0.05         # Reduced from 0.15 to 0.05
    zoning_weight: float = 0.05      # Reduced from 0.15 to 0.05
    
    # Distance thresholds
    max_distance_miles: float = 10.0
    
    # Size similarity thresholds
    size_tolerance_percent: float = 0.5  # 50% tolerance
    
    # Age similarity thresholds
    age_tolerance_years: int = 10
    
    # Value similarity thresholds
    value_tolerance_percent: float = 0.3  # 30% tolerance


class PropertyFilter(BaseModel):
    """Advanced filtering options for property search"""
    exclude_outliers: bool = True
    min_quality_score: float = 0.5
    require_coordinates: bool = False
    require_financial_data: bool = False
    exclude_residential: bool = True
    
    # Industrial-specific filters
    industrial_zoning_codes: List[str] = [
        "M1", "M2", "M3", "I-1", "I-2", "I-3", 
        "INDUSTRIAL", "MANUFACTURING", "WAREHOUSE"
    ]
    
    # Size filters for industrial properties
    min_industrial_size: float = 5000  # sq ft
    max_industrial_size: float = 1000000  # sq ft 