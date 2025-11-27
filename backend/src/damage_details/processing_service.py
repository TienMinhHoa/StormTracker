"""
Processing service to extract damage information and save to database.
"""
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from src.damage_details.extraction_service import damage_extraction_service
from src.damage_details.geocoding_service import geocoding_service
from src.damage_details.model import damage_details
from src.logger import logger


class DamageProcessingService:
    """Service to process damage text and save to database."""
    
    @staticmethod
    async def process_and_save_damage_text(
        db: AsyncSession,
        storm_id: str,
        damage_text: str
    ) -> List[Dict]:
        """
        Process damage description text and save to database.
        
        Steps:
        1. Extract damage information by location using LLM
        2. Geocode each location to get lat-lon
        3. Format data with location key as "lat-lon"
        4. Save to damage_details table
        
        Args:
            db: Database session
            storm_id: ID of the storm
            damage_text: Vietnamese text describing damages
            
        Returns:
            List of created damage detail records
        """
        logger.info(f"Processing damage text for storm {storm_id}")
        
        # Step 1: Extract damage by location using LLM
        extracted_locations = await damage_extraction_service.extract_damage_by_location(damage_text)
        
        if not extracted_locations:
            logger.warning("No damage information extracted from text")
            return []
        
        logger.info(f"Extracted {len(extracted_locations)} locations with damage data")
        
        # Step 2 & 3: Geocode and save each location
        created_records = []
        
        for location_data in extracted_locations:
            location_name = location_data.get("location", "")
            damages = location_data.get("damages", [])
            
            if not location_name or not damages:
                logger.warning(f"Skipping invalid location data: {location_data}")
                continue
            
            # Geocode the location
            coordinates = await geocoding_service.geocode_address(location_name)
            
            if not coordinates:
                logger.warning(f"Could not geocode location: {location_name}")
                continue
            
            lat, lon = coordinates
            location_key = geocoding_service.format_location_key(lat, lon)
            
            # Prepare content with location info
            content = {
                "location_name": location_name,
                "location_key": location_key,
                "latitude": lat,
                "longitude": lon,
                "damages": damages
            }
            
            # Save to database
            try:
                damage_record = await damage_details.create_damage_detail(
                    session=db,
                    storm_id=storm_id,
                    content=content
                )
                await db.flush()
                await db.refresh(damage_record)
                
                created_records.append({
                    "id": damage_record.id,
                    "location_name": location_name,
                    "location_key": location_key,
                    "damages": damages,
                    "created_at": damage_record.created_at
                })
                
                logger.info(f"Saved damage data for {location_name} ({location_key})")
                
            except Exception as e:
                logger.error(f"Error saving damage data for {location_name}: {str(e)}")
                continue
        
        # Commit all changes
        await db.commit()
        
        logger.info(f"Successfully processed and saved {len(created_records)} damage records")
        return created_records


damage_processing_service = DamageProcessingService()
