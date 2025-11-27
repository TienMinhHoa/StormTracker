"""
Geocoding service to convert Vietnamese addresses to latitude/longitude.
Uses Nominatim OpenStreetMap API (free, no API key required).
"""
import aiohttp
from typing import Optional, Tuple
from src.logger import logger


class GeocodingService:
    """Service to convert addresses to coordinates."""
    
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    
    @staticmethod
    async def geocode_address(address: str) -> Optional[Tuple[float, float]]:
        """
        Convert a Vietnamese address to (latitude, longitude).
        
        Args:
            address: Address string in Vietnamese (e.g., "Hà Nội", "Quảng Ninh")
            
        Returns:
            Tuple of (lat, lon) or None if geocoding fails
        """
        try:
            # Add Vietnam to address for better accuracy
            search_address = f"{address}, Vietnam"
            
            params = {
                "q": search_address,
                "format": "json",
                "limit": 1,
                "countrycodes": "vn",  # Restrict to Vietnam
                "accept-language": "vi"  # Vietnamese language preference
            }
            
            headers = {
                "User-Agent": "StormTracker/1.0 (Disaster Management System)"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    GeocodingService.NOMINATIM_URL,
                    params=params,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            lat = float(data[0]["lat"])
                            lon = float(data[0]["lon"])
                            logger.info(f"Geocoded '{address}' to ({lat}, {lon})")
                            return (lat, lon)
                    else:
                        logger.warning(f"Geocoding failed for '{address}': HTTP {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error geocoding address '{address}': {str(e)}")
            return None
    
    @staticmethod
    def format_location_key(lat: float, lon: float) -> str:
        """
        Format latitude and longitude into a location key.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Formatted string like "21.0285-105.8542"
        """
        return f"{lat:.4f}-{lon:.4f}"


geocoding_service = GeocodingService()
