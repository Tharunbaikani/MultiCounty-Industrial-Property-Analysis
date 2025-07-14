import asyncio
import math
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import json
import os
from openai import AsyncOpenAI
# from geopy.distance import geodesic

from database import Property, SessionLocal
from models.property_models import (
    PropertyResponse, 
    ComparableProperty, 
    ComparableResponse, 
    SimilarityFactors
)

logger = logging.getLogger(__name__)


class IntelligentComparableDiscoveryAgent:
    """
    Enhanced Agent responsible for finding comparable properties and generating confidence scores.
    Uses OpenAI for intelligent similarity analysis, market insights, and recommendation generation.
    """
    
    def __init__(self):
        self.similarity_factors = SimilarityFactors()
        
        # Initialize OpenAI client
        self.openai_client = AsyncOpenAI(
            api_key=os.getenv('OPENAI_API_KEY', '')
        )
        
    async def find_comparables(self, target_property: PropertyResponse, 
                             max_results: int = 10) -> List[ComparableProperty]:
        """Find comparable properties using intelligent analysis"""
        logger.info(f"Finding comparables for property {target_property.id} with AI assistance")
        
        # Get candidate properties
        candidates = await self.get_candidate_properties(target_property)
        
        if not candidates:
            logger.warning(f"No candidate properties found for {target_property.id}")
            return []
            
        # Use AI to enhance similarity analysis
        if self.openai_client.api_key:
            scored_properties = await self.ai_score_candidates(target_property, candidates)
        else:
            # Fallback to traditional scoring
            scored_properties = await self.traditional_score_candidates(target_property, candidates)
            
        # Sort by similarity score (descending)
        scored_properties.sort(key=lambda x: x.similarity_score, reverse=True)
        
        # Filter to only those with a sale price
        # scored_properties = [c for c in scored_properties if c.property.sale_price is not None]
        
        # Return top results (top 10 with sale price)
        results = scored_properties[:max_results]
        
        logger.info(f"Found {len(results)} comparable properties for {target_property.id}")
        return results
        
    async def ai_score_candidates(self, target_property: PropertyResponse, 
                                 candidates: List[PropertyResponse]) -> List[ComparableProperty]:
        """Use AI to score candidate properties for similarity"""
        logger.info(f"AI scoring {len(candidates)} candidate properties")
        
        scored_properties = []
        
        # Process candidates in batches to avoid overwhelming the AI
        batch_size = 5
        for i in range(0, len(candidates), batch_size):
            batch = candidates[i:i + batch_size]
            
            try:
                # Create batch comparison prompt
                target_summary = {
                    "address": target_property.address,
                    "city": target_property.city,
                    "building_area": target_property.building_area,
                    "zoning_code": target_property.zoning_code,
                    "year_built": target_property.year_built,
                    "assessed_value": target_property.assessed_value
                }
                
                candidates_summary = []
                for candidate in batch:
                    candidates_summary.append({
                        "id": candidate.id,
                        "address": candidate.address,
                        "city": candidate.city,
                        "building_area": candidate.building_area,
                        "zoning_code": candidate.zoning_code,
                        "year_built": candidate.year_built,
                        "assessed_value": candidate.assessed_value
                    })
                
                prompt = f"""
                You are an industrial real estate expert analyzing property comparables.
                
                Target Property:
                {json.dumps(target_summary, indent=2)}
                
                Candidate Properties:
                {json.dumps(candidates_summary, indent=2)}
                
                For each candidate, analyze similarity to the target property considering:
                1. Location (same city/area)
                2. Size (building area comparison)
                3. Age (year built similarity)
                4. Zoning (industrial classification)
                5. Value (assessed value reasonableness)
                
                Return JSON array with similarity scores (0.0-1.0) and confidence scores (0.0-1.0):
                [
                    {{"id": "candidate_id", "similarity_score": 0.85, "confidence_score": 0.90, "reasoning": "Similar size and location"}},
                    ...
                ]
                
                Only include candidates with similarity_score > 0.3.
                """
                
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an industrial real estate comparable analysis expert. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=2000
                )
                
                try:
                    ai_scores = json.loads(response.choices[0].message.content)
                    
                    # Process AI results
                    for score_data in ai_scores:
                        candidate_id = score_data.get("id")
                        similarity_score = score_data.get("similarity_score", 0.0)
                        confidence_score = score_data.get("confidence_score", 0.0)
                        reasoning = score_data.get("reasoning", "")
                        
                        # Find the candidate property
                        candidate = next((c for c in batch if c.id == candidate_id), None)
                        if candidate and similarity_score > 0.3:
                            distance = await self.calculate_distance(target_property, candidate)
                            
                            # Calculate detailed similarity factors
                            similarity_factors = await self.calculate_detailed_similarity_factors(
                                target_property, candidate
                            )
                            
                            comparable = ComparableProperty(
                                property=candidate,
                                similarity_score=similarity_score,
                                distance_miles=distance,
                                similarity_factors=similarity_factors,
                                confidence_score=confidence_score
                            )
                            
                            scored_properties.append(comparable)
                            
                except json.JSONDecodeError:
                    # Fallback to traditional scoring for this batch
                    logger.warning(f"AI scoring failed for batch {i//batch_size + 1}, using traditional method")
                    batch_scored = await self.traditional_score_candidates(target_property, batch)
                    scored_properties.extend(batch_scored)
                    
            except Exception as e:
                logger.error(f"Error in AI scoring for batch {i//batch_size + 1}: {e}")
                # Fallback to traditional scoring
                batch_scored = await self.traditional_score_candidates(target_property, batch)
                scored_properties.extend(batch_scored)
                
        return scored_properties
        
    async def traditional_score_candidates(self, target_property: PropertyResponse, 
                                         candidates: List[PropertyResponse]) -> List[ComparableProperty]:
        """Traditional scoring method when AI is not available"""
        scored_properties = []
        
        for candidate in candidates:
            if candidate.id == target_property.id:
                continue  # Skip the target property itself
                
            similarity_score, similarity_factors, confidence_score = await self.calculate_similarity(
                target_property, candidate
            )
            
            if similarity_score > 0.3:  # Minimum similarity threshold
                distance = await self.calculate_distance(target_property, candidate)
                
                comparable = ComparableProperty(
                    property=candidate,
                    similarity_score=similarity_score,
                    distance_miles=distance,
                    similarity_factors=similarity_factors,
                    confidence_score=confidence_score
                )
                
                scored_properties.append(comparable)
                
        return scored_properties
        
    async def calculate_detailed_similarity_factors(self, target: PropertyResponse, 
                                                   candidate: PropertyResponse) -> Dict[str, float]:
        """Calculate detailed similarity factors between two properties"""
        similarity_factors = {}
        
        # Location similarity
        location_score = await self.calculate_location_similarity(target, candidate)
        similarity_factors["location"] = location_score
        
        # Size similarity
        size_score = await self.calculate_size_similarity(target, candidate)
        similarity_factors["size"] = size_score
        
        # Age similarity
        age_score = await self.calculate_age_similarity(target, candidate)
        similarity_factors["age"] = age_score
        
        # Zoning similarity
        zoning_score = await self.calculate_zoning_similarity(target, candidate)
        similarity_factors["zoning"] = zoning_score
        
        # Value similarity
        value_score = await self.calculate_value_similarity(target, candidate)
        similarity_factors["value"] = value_score
        
        return similarity_factors
        
    async def ai_generate_market_insights(self, target_property: PropertyResponse, 
                                        comparables: List[ComparableProperty]) -> Dict[str, Any]:
        """Use AI to generate market insights and analysis"""
        if not self.openai_client.api_key:
            return await self.traditional_market_analysis(target_property, comparables)
            
        try:
            # Prepare data for AI analysis
            target_summary = {
                "address": target_property.address,
                "city": target_property.city,
                "building_area": target_property.building_area,
                "assessed_value": target_property.assessed_value,
                "year_built": target_property.year_built
            }
            
            comparables_summary = []
            for comp in comparables:
                comparables_summary.append({
                    "address": comp.property.address,
                    "city": comp.property.city,
                    "building_area": comp.property.building_area,
                    "assessed_value": comp.property.assessed_value,
                    "year_built": comp.property.year_built,
                    "similarity_score": comp.similarity_score,
                    "distance_miles": comp.distance_miles
                })
            
            prompt = f"""
            Analyze this industrial property and its comparables to provide market insights:
            
            Target Property:
            {json.dumps(target_summary, indent=2)}
            
            Comparable Properties:
            {json.dumps(comparables_summary, indent=2)}
            
            Provide analysis in JSON format:
            {{
                "market_position": "above_market|at_market|below_market",
                "value_range": {{"min": 0, "max": 0}},
                "market_trends": "Description of market trends",
                "key_insights": ["insight1", "insight2", ...],
                "recommendations": ["recommendation1", "recommendation2", ...]
            }}
            
            Consider:
            - Price per square foot analysis
            - Market positioning
            - Location advantages/disadvantages
            - Property characteristics
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an industrial real estate market analyst. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=1500
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"Error in AI market analysis: {e}")
            return await self.traditional_market_analysis(target_property, comparables)
            
    async def traditional_market_analysis(self, target_property: PropertyResponse, 
                                        comparables: List[ComparableProperty]) -> Dict[str, Any]:
        """Traditional market analysis when AI is not available"""
        if not comparables:
            return {
                "market_position": "unknown",
                "value_range": {"min": 0, "max": 0},
                "market_trends": "Insufficient data for analysis",
                "key_insights": ["No comparable properties found"],
                "recommendations": ["Expand search criteria"]
            }
            
        # Calculate price per square foot
        target_psf = 0
        if target_property.assessed_value and target_property.building_area:
            target_psf = target_property.assessed_value / target_property.building_area
            
        comparable_psf = []
        for comp in comparables:
            if comp.property.assessed_value and comp.property.building_area:
                psf = comp.property.assessed_value / comp.property.building_area
                comparable_psf.append(psf)
                
        if comparable_psf:
            avg_psf = sum(comparable_psf) / len(comparable_psf)
            min_psf = min(comparable_psf)
            max_psf = max(comparable_psf)
            
            # Determine market position
            if target_psf > avg_psf * 1.1:
                market_position = "above_market"
            elif target_psf < avg_psf * 0.9:
                market_position = "below_market"
            else:
                market_position = "at_market"
                
            # Estimate value range
            if target_property.building_area:
                value_range = {
                    "min": int(min_psf * target_property.building_area),
                    "max": int(max_psf * target_property.building_area)
                }
            else:
                value_range = {"min": 0, "max": 0}
                
            return {
                "market_position": market_position,
                "value_range": value_range,
                "market_trends": f"Average price per sq ft: ${avg_psf:.2f}",
                "key_insights": [
                    f"Property positioned {market_position.replace('_', ' ')}",
                    f"Comparable properties range from ${min_psf:.2f} to ${max_psf:.2f} per sq ft"
                ],
                "recommendations": [
                    "Consider local market conditions",
                    "Review property condition and amenities"
                ]
            }
        else:
            return {
                "market_position": "unknown",
                "value_range": {"min": 0, "max": 0},
                "market_trends": "Insufficient valuation data",
                "key_insights": ["Comparable properties lack sufficient valuation data"],
                "recommendations": ["Obtain professional appraisal"]
            }
            
    async def ai_generate_recommendations(self, target_property: PropertyResponse, 
                                        comparables: List[ComparableProperty]) -> List[str]:
        """Use AI to generate intelligent recommendations"""
        if not self.openai_client.api_key:
            return await self.traditional_generate_recommendations(target_property, comparables)
            
        try:
            # Prepare summary for AI
            analysis_summary = {
                "target_property": {
                    "address": target_property.address,
                    "city": target_property.city,
                    "building_area": target_property.building_area,
                    "assessed_value": target_property.assessed_value
                },
                "comparables_count": len(comparables),
                "avg_similarity_score": sum([c.similarity_score for c in comparables]) / len(comparables) if comparables else 0,
                "distance_range": {
                    "min": min([c.distance_miles for c in comparables if c.distance_miles]) if comparables else 0,
                    "max": max([c.distance_miles for c in comparables if c.distance_miles]) if comparables else 0
                }
            }
            
            prompt = f"""
            Based on this industrial property analysis, provide actionable recommendations:
            
            {json.dumps(analysis_summary, indent=2)}
            
            Generate 3-5 specific, actionable recommendations for the property owner/investor.
            Consider:
            - Market positioning
            - Property valuation
            - Investment opportunities
            - Risk factors
            - Market trends
            
            Return as JSON array of strings:
            ["recommendation1", "recommendation2", ...]
            """
            
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an industrial real estate advisor. Return only a JSON array of recommendation strings."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            
            recommendations = json.loads(response.choices[0].message.content)
            return recommendations if isinstance(recommendations, list) else []
            
        except Exception as e:
            logger.error(f"Error in AI recommendations: {e}")
            return await self.traditional_generate_recommendations(target_property, comparables)
            
    async def traditional_generate_recommendations(self, target_property: PropertyResponse, 
                                                 comparables: List[ComparableProperty]) -> List[str]:
        """Traditional recommendations when AI is not available"""
        recommendations = []
        
        if not comparables:
            recommendations.append("Expand search criteria to find more comparable properties")
            recommendations.append("Consider properties in adjacent markets")
            return recommendations
            
        # Analyze similarity scores
        avg_similarity = sum([c.similarity_score for c in comparables]) / len(comparables)
        
        if avg_similarity < 0.6:
            recommendations.append("Consider expanding search radius for better comparables")
            
        # Analyze distances
        distances = [c.distance_miles for c in comparables if c.distance_miles]
        if distances:
            avg_distance = sum(distances) / len(distances)
            if avg_distance > 10:
                recommendations.append("Consider local market factors due to distance from comparables")
                
        # General recommendations
        recommendations.append("Review property condition and maintenance requirements")
        recommendations.append("Consider market trends and economic factors")
        recommendations.append("Evaluate potential for property improvements")
        
        return recommendations[:5]  # Limit to 5 recommendations 
    
    async def get_candidate_properties(self, target_property: PropertyResponse) -> List[PropertyResponse]:
        """Get candidate properties for comparison"""
        from database import SessionLocal, Property
        
        db = SessionLocal()
        try:
            # Build query for candidate properties
            query = db.query(Property).filter(
                Property.id != target_property.id,  # Exclude the target property
                Property.building_area.isnot(None)  # Must have building area
            )
            
            # Prefer same county, but also include others
            same_county_query = query.filter(Property.county_id == target_property.county_id)
            same_county_results = same_county_query.limit(50).all()
            
            # If not enough from same county, get from other counties
            if len(same_county_results) < 20:
                other_county_query = query.filter(Property.county_id != target_property.county_id)
                other_county_results = other_county_query.limit(50 - len(same_county_results)).all()
                all_results = same_county_results + other_county_results
            else:
                all_results = same_county_results
                
            # Convert to PropertyResponse objects
            candidates = []
            for prop in all_results:
                candidate = PropertyResponse(
                    id=prop.id,
                    county_id=prop.county_id,
                    address=prop.address,
                    city=prop.city,
                    state=prop.state,
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
                candidates.append(candidate)
                
            return candidates
            
        finally:
            db.close()
    
    async def calculate_similarity(self, target_property: PropertyResponse, 
                                 candidate: PropertyResponse) -> tuple[float, Dict[str, float], float]:
        """Calculate overall similarity score, factors, and confidence"""
        
        # Calculate individual similarity factors
        location_score = await self.calculate_location_similarity(target_property, candidate)
        size_score = await self.calculate_size_similarity(target_property, candidate)
        age_score = await self.calculate_age_similarity(target_property, candidate)
        zoning_score = await self.calculate_zoning_similarity(target_property, candidate)
        value_score = await self.calculate_value_similarity(target_property, candidate)
        sale_price_score = await self.calculate_sale_price_similarity(target_property, candidate)
        
        # Weight factors based on SimilarityFactors
        factors = self.similarity_factors
        
        # Calculate weighted similarity score
        similarity_score = (
            location_score * factors.location_weight +
            size_score * factors.size_weight +
            age_score * factors.age_weight +
            zoning_score * factors.zoning_weight +
            value_score * factors.value_weight +
            sale_price_score * factors.sale_price_weight
        )
        
        # Prepare similarity factors breakdown
        similarity_factors = {
            "location": location_score,
            "size": size_score,
            "age": age_score,
            "zoning": zoning_score,
            "value": value_score,
            "sale_price": sale_price_score
        }
        
        # Calculate confidence score based on data completeness
        confidence_score = await self.calculate_confidence_score(target_property, candidate)
        
        return similarity_score, similarity_factors, confidence_score
    
    async def calculate_location_similarity(self, target: PropertyResponse, 
                                          candidate: PropertyResponse) -> float:
        """Calculate location similarity score (0-1)"""
        # Same city gets high score
        if target.city.lower() == candidate.city.lower():
            return 1.0
            
        # Same county gets medium score
        if target.county_id == candidate.county_id:
            return 0.8
            
        # Different county gets lower score
        return 0.3
    
    async def calculate_size_similarity(self, target: PropertyResponse, 
                                      candidate: PropertyResponse) -> float:
        """Calculate size similarity score based on building area (0-1)"""
        if not target.building_area or not candidate.building_area:
            return 0.0
            
        # Calculate relative difference
        larger = max(target.building_area, candidate.building_area)
        smaller = min(target.building_area, candidate.building_area)
        
        # Calculate similarity (closer to 1 means more similar)
        if larger == 0:
            return 0.0
            
        ratio = smaller / larger
        
        # Apply tolerance - within 50% is considered good
        if ratio >= 0.5:
            return ratio
        else:
            # Penalize heavily for large differences
            return ratio * 0.5
    
    async def calculate_age_similarity(self, target: PropertyResponse, 
                                     candidate: PropertyResponse) -> float:
        """Calculate age similarity score based on year built (0-1)"""
        if not target.year_built or not candidate.year_built:
            return 0.5  # Neutral score if data missing
            
        age_diff = abs(target.year_built - candidate.year_built)
        tolerance = self.similarity_factors.age_tolerance_years
        
        if age_diff <= tolerance:
            return 1.0 - (age_diff / tolerance * 0.5)  # Linear decay within tolerance
        else:
            return max(0.0, 0.5 - (age_diff - tolerance) / (tolerance * 2))  # Faster decay beyond tolerance
    
    async def calculate_zoning_similarity(self, target: PropertyResponse, 
                                        candidate: PropertyResponse) -> float:
        """Calculate zoning similarity score (0-1)"""
        if not target.zoning_code or not candidate.zoning_code:
            return 0.5  # Neutral score if data missing
            
        target_zoning = target.zoning_code.upper()
        candidate_zoning = candidate.zoning_code.upper()
        
        # Exact match
        if target_zoning == candidate_zoning:
            return 1.0
            
        # Industrial zoning variations
        industrial_codes = {"M1", "M2", "M3", "I-1", "I-2", "I-3", "I1", "I2", "I3", "INDUSTRIAL"}
        
        if target_zoning in industrial_codes and candidate_zoning in industrial_codes:
            return 0.8  # Both industrial but different types
            
        # General industrial keywords
        if "INDUSTRIAL" in target_zoning and "INDUSTRIAL" in candidate_zoning:
            return 0.7
        if "MANUFACTURING" in target_zoning and "MANUFACTURING" in candidate_zoning:
            return 0.7
        if "WAREHOUSE" in target_zoning and "WAREHOUSE" in candidate_zoning:
            return 0.7
            
        return 0.3  # Different zoning types
    
    async def calculate_value_similarity(self, target: PropertyResponse, 
                                       candidate: PropertyResponse) -> float:
        """Calculate value similarity score based on assessed value (0-1)"""
        if not target.assessed_value or not candidate.assessed_value:
            return 0.5  # Neutral score if data missing
            
        # Calculate relative difference
        larger = max(target.assessed_value, candidate.assessed_value)
        smaller = min(target.assessed_value, candidate.assessed_value)
        
        if larger == 0:
            return 0.0
            
        ratio = smaller / larger
        tolerance = self.similarity_factors.value_tolerance_percent
        
        if ratio >= (1 - tolerance):
            return 1.0
        else:
            # Linear decay based on difference
            return max(0.0, ratio)
    
    async def calculate_sale_price_similarity(self, target: PropertyResponse, candidate: PropertyResponse) -> float:
        """Calculate sale price similarity score based on last sale amount (0-1)"""
        if not target.sale_price or not candidate.sale_price:
            return 0.5  # Neutral score if data missing
        
        larger = max(target.sale_price, candidate.sale_price)
        smaller = min(target.sale_price, candidate.sale_price)
        if larger == 0:
            return 0.0
        ratio = smaller / larger
        tolerance = 0.3  # 30% tolerance, similar to value
        if ratio >= (1 - tolerance):
            return 1.0
        else:
            return max(0.0, ratio)
    
    async def calculate_distance(self, target: PropertyResponse, 
                               candidate: PropertyResponse) -> float:
        """Calculate distance between two properties in miles"""
        if not (target.latitude and target.longitude and 
                candidate.latitude and candidate.longitude):
            # If no coordinates, use city-based estimation
            if target.city.lower() == candidate.city.lower():
                return 5.0  # Same city - estimate 5 miles
            elif target.county_id == candidate.county_id:
                return 25.0  # Same county - estimate 25 miles
            else:
                return 100.0  # Different county - estimate 100 miles
        
        # Calculate great circle distance using Haversine formula
        import math
        
        lat1, lon1 = math.radians(target.latitude), math.radians(target.longitude)
        lat2, lon2 = math.radians(candidate.latitude), math.radians(candidate.longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of Earth in miles
        radius_miles = 3959
        
        return radius_miles * c
    
    async def calculate_confidence_score(self, target: PropertyResponse, 
                                       candidate: PropertyResponse) -> float:
        """Calculate confidence score based on data completeness and quality"""
        target_completeness = self.calculate_data_completeness(target)
        candidate_completeness = self.calculate_data_completeness(candidate)
        
        # Average completeness
        avg_completeness = (target_completeness + candidate_completeness) / 2
        
        # Factor in quality scores if available
        target_quality = target.quality_score or 0.5
        candidate_quality = candidate.quality_score or 0.5
        avg_quality = (target_quality + candidate_quality) / 2
        
        # Combine completeness and quality
        confidence = (avg_completeness * 0.6) + (avg_quality * 0.4)
        
        return min(1.0, confidence)
    
    def calculate_data_completeness(self, prop: PropertyResponse) -> float:
        """Calculate data completeness score for a property"""
        total_fields = 0
        completed_fields = 0
        
        # Essential fields
        essential_fields = [
            prop.address, prop.city, prop.state, prop.building_area,
            prop.zoning_code, prop.county_id
        ]
        
        for field in essential_fields:
            total_fields += 1
            if field:
                completed_fields += 1
                
        # Optional but valuable fields
        optional_fields = [
            prop.year_built, prop.assessed_value, prop.latitude, 
            prop.longitude, prop.lot_area
        ]
        
        for field in optional_fields:
            total_fields += 1
            if field:
                completed_fields += 1
                
        return completed_fields / total_fields if total_fields > 0 else 0.0 