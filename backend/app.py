from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
from contextlib import asynccontextmanager

from agents.api_discovery_agent import IntelligentAPIDiscoveryAgent
from agents.data_extraction_system import IntelligentDataExtractionSystem
from agents.comparable_discovery_agent import IntelligentComparableDiscoveryAgent
from database import init_db, get_db
from models.property_models import PropertySearch, PropertyResponse, ComparableResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db()
    
    # Initialize agents
    app.state.api_discovery_agent = IntelligentAPIDiscoveryAgent()
    app.state.data_extraction_system = IntelligentDataExtractionSystem()
    app.state.comparable_discovery_agent = IntelligentComparableDiscoveryAgent()
    
    # Skip API discovery since we're using ATTOM API exclusively
    # await app.state.api_discovery_agent.discover_all_apis()
    
    yield
    
    # Cleanup
    pass


app = FastAPI(
    title="Starboard AI Property Analysis",
    description="Multi-County Industrial Property Comparable Analysis System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Starboard AI Property Analysis API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/counties")
async def get_counties():
    """Get list of supported counties"""
    return {
        "counties": [
            {"id": "cook", "name": "Cook County, Illinois", "state": "IL"},
            {"id": "dallas", "name": "Dallas County, Texas", "state": "TX"},
            {"id": "los_angeles", "name": "Los Angeles County, California", "state": "CA"}
        ]
    }


@app.post("/api/properties/search")
async def search_properties(search_params: PropertySearch):
    """Search for properties in specified counties"""
    try:
        results = await app.state.data_extraction_system.search_properties(
            counties=search_params.counties,
            property_type=search_params.property_type,
            min_size=search_params.min_size,
            max_size=search_params.max_size,
            zoning_codes=search_params.zoning_codes
        )
        
        return {"properties": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/properties/comparables")
async def find_comparables(property_data: PropertyResponse):
    """Find comparable properties for a given property"""
    try:
        comparables = await app.state.comparable_discovery_agent.find_comparables(
            property_data
        )
        
        # Convert ComparableProperty objects to dictionaries for JSON serialization
        comparable_dicts = []
        for comp in comparables:
            comparable_dict = {
                "property": comp.property.dict(),
                "similarity_score": comp.similarity_score,
                "distance_miles": comp.distance_miles,
                "similarity_factors": comp.similarity_factors,
                "confidence_score": comp.confidence_score
            }
            comparable_dicts.append(comparable_dict)
        
        return {
            "target_property": property_data.dict(),
            "comparables": comparable_dicts,
            "count": len(comparable_dicts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/properties/{property_id}")
async def get_property(property_id: str):
    """Get detailed information about a specific property"""
    try:
        property_data = await app.state.data_extraction_system.get_property_by_id(
            property_id
        )
        
        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")
            
        return property_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/apis/status")
async def get_api_status():
    """Get status of data sources"""
    try:
        # Since we're using ATTOM API exclusively, return simplified status
        return {
            "data_source": "ATTOM API",
            "status": "active",
            "message": "Using ATTOM API for all property data",
            "counties_supported": ["cook", "dallas", "los_angeles"],
            "total_properties": 2000
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/data/extract")
async def extract_data(county_id: str):
    """Manually trigger data extraction for a specific county using ATTOM API"""
    try:
        # Note: This now uses ATTOM API exclusively, not individual county APIs
        result = await app.state.data_extraction_system.extract_county_data(county_id)
        return {"message": f"Data extraction completed for {county_id} using ATTOM API", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/data/extract-all")
async def extract_all_data():
    """Extract data from all counties using ATTOM API"""
    try:
        results = await app.state.data_extraction_system.extract_all_counties_data()
        
        total_extracted = sum(
            result.get("records_saved", 0) for result in results.values() 
            if isinstance(result, dict) and "records_saved" in result
        )
        
        return {
            "message": f"Data extraction completed for all counties using ATTOM API. Total properties extracted: {total_extracted}",
            "results": results,
            "data_source": "ATTOM API"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data/stats")
async def get_data_stats():
    """Get statistics about the current property database"""
    try:
        from database import SessionLocal, Property
        
        db = SessionLocal()
        try:
            # Get counts by county
            stats = {}
            for county in ["cook", "dallas", "los_angeles"]:
                count = db.query(Property).filter(Property.county_id == county).count()
                stats[county] = count
                
            total_count = db.query(Property).count()
            
            return {
                "total_properties": total_count,
                "by_county": stats,
                "message": f"Database contains {total_count} industrial properties"
            }
        finally:
            db.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 