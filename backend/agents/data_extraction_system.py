import asyncio
import aiohttp
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import logging
import ssl
import os
from openai import AsyncOpenAI

from database import Property, SessionLocal, log_extraction
from models.property_models import PropertyResponse, PropertySearch, PropertyFilter

logger = logging.getLogger(__name__)


class IntelligentDataExtractionSystem:
    """
    Enhanced Agent responsible for extracting and processing property data from ATTOM API.
    Uses OpenAI for intelligent data validation, outlier detection, and processing decisions.
    """
    
    def __init__(self):
        self.session = None
        self.industrial_zoning_codes = {
            "M1", "M2", "M3", "I-1", "I-2", "I-3", "I1", "I2", "I3",
            "INDUSTRIAL", "MANUFACTURING", "WAREHOUSE", "DISTRIBUTION"
        }
        
        # Initialize OpenAI client
        try:
            self.openai_client = AsyncOpenAI(
                api_key=os.getenv('OPENAI_API_KEY', '')
            )
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}")
            self.openai_client = None
        
    async def __aenter__(self):
        # Create SSL context that is more permissive for APIs with certificate issues
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        self.session = aiohttp.ClientSession(connector=connector)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            
    async def extract_attom_data(self, limit: int = 2000) -> Dict[str, Any]:
        """Extract data from ATTOM API with intelligent processing"""
        logger.info("Extracting data from ATTOM API")
        
        start_time = time.time()
        
        # Use the existing ATTOM extraction script
        from extract_real_county_data import EnhancedRealPropertyExtractor
        
        try:
            async with EnhancedRealPropertyExtractor() as extractor:
                attom_data = await extractor.extract_attomdata_industrial_properties(limit)
                
                # Process with AI
                processed_data = await self.ai_process_attom_data(attom_data)
                
                # Save to database
                saved_count = await extractor.save_properties_to_database(processed_data)
                
                end_time = time.time()
                execution_time = end_time - start_time
                
                result = {
                    "county_id": "attom_national",
                    "records_found": len(attom_data),
                    "records_processed": len(processed_data),
                    "industrial_properties": len(processed_data),
                    "records_saved": saved_count,
                    "execution_time": execution_time,
                    "status": "success"
                }
                
                logger.info(f"ATTOM data extraction completed: {result}")
                return result
                
        except Exception as e:
            logger.error(f"Error extracting ATTOM data: {e}")
            raise
            
    async def ai_process_attom_data(self, attom_data: List[Dict]) -> List[Dict]:
        """Process ATTOM data with AI validation"""
        logger.info(f"Processing {len(attom_data)} ATTOM records with AI")
        
        if not attom_data:
            return []
            
        processed_data = []
        
        for record in attom_data:
            try:
                # Validate with AI
                is_valid = await self.ai_validate_property_data(record)
                
                if is_valid:
                    # Calculate quality score
                    quality_score = await self.ai_calculate_quality_score(record)
                    record["quality_score"] = quality_score
                    
                    # Check for outliers
                    outliers = await self.ai_check_outliers(record)
                    record["outlier_flags"] = outliers
                    
                    processed_data.append(record)
                    
            except Exception as e:
                logger.error(f"Error processing ATTOM record: {e}")
                continue
                
        return processed_data
        
    async def ai_validate_property_data(self, property_data: Dict) -> bool:
        """Use AI to validate property data"""
        if not self.openai_client or not self.openai_client.api_key:
            return await self.fallback_validate_property_data(property_data)
            
        try:
            prompt = f"""
            Validate this industrial property data for completeness and reasonableness:
            {json.dumps(property_data, indent=2)}
            
            Check for:
            1. Required fields present (address, city, state)
            2. Reasonable values (positive building area, valid year_built)
            3. Data consistency (e.g., assessed_value should be reasonable for building_area)
            4. Properly formatted fields
            
            Return only "true" if the data is valid for industrial property analysis, "false" otherwise.
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a real estate data validator. Return only 'true' or 'false'."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=10
            )
            
            result = response.choices[0].message.content.strip().lower()
            return result == "true"
            
        except Exception as e:
            logger.error(f"Error in AI validation: {e}")
            return await self.fallback_validate_property_data(property_data)
            
    async def ai_calculate_quality_score(self, property_data: Dict) -> float:
        """Use AI to calculate data quality score"""
        if not self.openai_client or not self.openai_client.api_key:
            return await self.fallback_calculate_quality_score(property_data)
            
        try:
            prompt = f"""
            Calculate a quality score (0.0 to 1.0) for this property data:
            {json.dumps(property_data, indent=2)}
            
            Consider:
            - Completeness (all important fields present)
            - Accuracy (reasonable values)
            - Consistency (fields relate logically)
            - Usefulness for property analysis
            
            Return only a decimal number between 0.0 and 1.0.
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a data quality expert. Return only a number between 0.0 and 1.0."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=10
            )
            
            try:
                score = float(response.choices[0].message.content.strip())
                return max(0.0, min(1.0, score))  # Clamp between 0 and 1
            except ValueError:
                return 0.5  # Default if parsing fails
                
        except Exception as e:
            logger.error(f"Error in AI quality scoring: {e}")
            return await self.fallback_calculate_quality_score(property_data)
            
    async def ai_check_outliers(self, property_data: Dict) -> List[str]:
        """Use AI to check for outliers in property data"""
        if not self.openai_client or not self.openai_client.api_key:
            return await self.fallback_check_outliers(property_data)
            
        try:
            prompt = f"""
            Identify potential outliers in this industrial property data:
            {json.dumps(property_data, indent=2)}
            
            Check for:
            - Unusually high/low building areas
            - Unreasonable assessed values
            - Inconsistent year_built values
            - Other suspicious data points
            
            Return a JSON array of outlier descriptions.
            Example: ["Building area unusually large", "Assessed value too low for size"]
            Return empty array [] if no outliers found.
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a real estate data analyst. Return only a JSON array."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200
            )
            
            try:
                outliers = json.loads(response.choices[0].message.content)
                return outliers if isinstance(outliers, list) else []
            except json.JSONDecodeError:
                return []
                
        except Exception as e:
            logger.error(f"Error in AI outlier detection: {e}")
            return await self.fallback_check_outliers(property_data)
            
    # Fallback methods for when AI is not available
    async def fallback_validate_property_data(self, property_data: Dict) -> bool:
        """Fallback validation when AI is not available"""
        required_fields = ["address", "city", "state"]
        
        # Check required fields
        for field in required_fields:
            if not property_data.get(field):
                return False
                
        # Check reasonable values
        if property_data.get("building_area") and property_data["building_area"] <= 0:
            return False
            
        if property_data.get("year_built") and (property_data["year_built"] < 1800 or property_data["year_built"] > 2024):
            return False
            
        return True
        
    async def fallback_calculate_quality_score(self, property_data: Dict) -> float:
        """Fallback quality scoring when AI is not available"""
        score = 0.0
        total_checks = 0
        
        # Check completeness
        important_fields = ["address", "city", "state", "building_area", "assessed_value", "zoning_code"]
        for field in important_fields:
            total_checks += 1
            if property_data.get(field):
                score += 1
                
        # Check data reasonableness
        if property_data.get("building_area") and property_data["building_area"] > 0:
            score += 0.2
        if property_data.get("year_built") and 1800 <= property_data["year_built"] <= 2024:
            score += 0.2
            
        total_checks += 2
        
        return min(1.0, score / total_checks)
        
    async def fallback_check_outliers(self, property_data: Dict) -> List[str]:
        """Fallback outlier detection when AI is not available"""
        outliers = []
        
        # Check building area outliers
        if property_data.get("building_area"):
            area = property_data["building_area"]
            if area > 1000000:  # Over 1M sq ft
                outliers.append("Building area unusually large")
            elif area < 500:  # Under 500 sq ft
                outliers.append("Building area unusually small")
                
        # Check assessed value outliers
        if property_data.get("assessed_value"):
            value = property_data["assessed_value"]
            if value > 50000000:  # Over $50M
                outliers.append("Assessed value unusually high")
            elif value < 10000:  # Under $10K
                outliers.append("Assessed value unusually low")
                
        return outliers
        
    async def search_properties(self, counties: List[str], property_type: str = None, 
                              min_size: float = None, max_size: float = None,
                              zoning_codes: List[str] = None) -> List[PropertyResponse]:
        """Search properties with filters"""
        db = SessionLocal()
        
        try:
            query = db.query(Property)
            
            # Filter by counties
            if counties:
                query = query.filter(Property.county_id.in_(counties))
                
            # Filter by property type
            if property_type:
                query = query.filter(Property.property_type.ilike(f"%{property_type}%"))
                
            # Filter by size
            if min_size:
                query = query.filter(Property.building_area >= min_size)
            if max_size:
                query = query.filter(Property.building_area <= max_size)
                
            # Filter by zoning codes
            if zoning_codes:
                from sqlalchemy import or_
                zoning_conditions = []
                for code in zoning_codes:
                    zoning_conditions.append(Property.zoning_code.ilike(f"%{code}%"))
                if zoning_conditions:
                    query = query.filter(or_(*zoning_conditions))
                    
            # Get results
            properties = query.limit(100).all()
            
            # Convert to response format
            results = []
            for prop in properties:
                result = PropertyResponse(
                    id=prop.id,
                    county_id=prop.county_id,
                    address=prop.address or "",
                    city=prop.city or "",
                    state=prop.state or "",
                    zip_code=prop.zip_code,
                    property_type=prop.property_type,
                    zoning_code=prop.zoning_code,
                    building_area=prop.building_area,
                    lot_area=prop.lot_area,
                    year_built=prop.year_built,
                    assessed_value=prop.assessed_value,
                    market_value=prop.market_value,
                    sale_price=prop.sale_price,
                    sale_date=prop.sale_date,
                    latitude=prop.latitude,
                    longitude=prop.longitude,
                    data_source=prop.data_source,
                    last_updated=prop.last_updated,
                    quality_score=prop.quality_score,
                    is_verified=prop.is_verified,
                    outlier_flags=prop.outlier_flags
                )
                results.append(result)
                
            return results
            
        finally:
            db.close()
            
    async def get_property_by_id(self, property_id: str) -> Optional[PropertyResponse]:
        """Get a specific property by ID"""
        db = SessionLocal()
        
        try:
            prop = db.query(Property).filter(Property.id == property_id).first()
            
            if not prop:
                return None
                
            return PropertyResponse(
                id=prop.id,
                county_id=prop.county_id,
                address=prop.address or "",
                city=prop.city or "",
                state=prop.state or "",
                zip_code=prop.zip_code,
                property_type=prop.property_type,
                zoning_code=prop.zoning_code,
                building_area=prop.building_area,
                lot_area=prop.lot_area,
                year_built=prop.year_built,
                assessed_value=prop.assessed_value,
                market_value=prop.market_value,
                sale_price=prop.sale_price,
                sale_date=prop.sale_date,
                latitude=prop.latitude,
                longitude=prop.longitude,
                data_source=prop.data_source,
                last_updated=prop.last_updated,
                quality_score=prop.quality_score,
                is_verified=prop.is_verified,
                outlier_flags=prop.outlier_flags
            )
            
        finally:
            db.close() 