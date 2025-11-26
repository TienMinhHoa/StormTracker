"""
Script to insert sample forecast data for testing
Run this with: python insert_forecast_sample.py
"""
import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from src.config import settings
from src.models import Forecast

# Sample data from user's request
SAMPLE_FORECAST_DATA = {
    "current": {
        "time": "2024-11-26 13:00",
        "position": {"lat": 12.4, "lon": 116.6},
        "intensity": {"wind": 9, "gust": 11},
        "movement": {"direction": "Tây Tây Bắc", "speed_kmh": 20},
        "risk_level": None
    },
    "forecast": [
        {
            "time": "2024-11-27 13:00",
            "position": {"lat": 12.7, "lon": 114.1},
            "intensity": {"wind": 11, "gust": 14},
            "movement": {"direction": "Tây Tây Bắc", "speed_kmh": 10},
            "danger_zone": {
                "lat_range": [11.0, 15.0],
                "lon_range": [112.0, 118.5]
            },
            "risk_level": 3
        },
        {
            "time": "2024-11-28 13:00",
            "position": {"lat": 12.4, "lon": 112.9},
            "intensity": {"wind": 11, "gust": 14},
            "movement": {"direction": "Tây Tây Nam", "speed_kmh": 5},
            "danger_zone": {
                "lat_range": [11.0, 15.0],
                "lon_range": [111.0, 116.0]
            },
            "risk_level": 3
        },
        {
            "time": "2024-11-29 13:00",
            "position": {"lat": 13.1, "lon": 112.0},
            "intensity": {"wind": "10-11", "gust": 14},
            "movement": {"direction": "Tây Bắc", "speed_kmh": 5},
            "danger_zone": {
                "lat_range": [11.0, 15.0],
                "lon_range": [110.5, 115.0]
            },
            "risk_level": 3
        }
    ],
    "long_range": {
        "time_range": "72-120h",
        "movement": {"direction": "Bắc Tây Bắc", "speed_kmh": "3-5"},
        "intensity_trend": "Suy yếu dần"
    }
}

# JTWC sample data (similar but with slight differences)
SAMPLE_JTWC_DATA = {
    "current": {
        "time": "2024-11-26 13:00",
        "position": {"lat": 12.5, "lon": 116.7},
        "intensity": {"wind": 10, "gust": 12},
        "movement": {"direction": "West-Northwest", "speed_kmh": 22},
        "risk_level": None
    },
    "forecast": [
        {
            "time": "2024-11-27 13:00",
            "position": {"lat": 12.8, "lon": 114.3},
            "intensity": {"wind": 12, "gust": 15},
            "movement": {"direction": "West-Northwest", "speed_kmh": 12},
            "danger_zone": {
                "lat_range": [10.5, 15.5],
                "lon_range": [112.0, 119.0]
            },
            "risk_level": 3
        },
        {
            "time": "2024-11-28 13:00",
            "position": {"lat": 12.5, "lon": 113.1},
            "intensity": {"wind": 12, "gust": 15},
            "movement": {"direction": "West-Southwest", "speed_kmh": 6},
            "danger_zone": {
                "lat_range": [10.5, 15.5],
                "lon_range": [111.0, 117.0]
            },
            "risk_level": 3
        },
        {
            "time": "2024-11-29 13:00",
            "position": {"lat": 13.2, "lon": 112.2},
            "intensity": {"wind": 11, "gust": 14},
            "movement": {"direction": "Northwest", "speed_kmh": 6},
            "danger_zone": {
                "lat_range": [10.5, 15.5],
                "lon_range": [110.0, 115.5]
            },
            "risk_level": 3
        }
    ],
    "long_range": {
        "time_range": "72-120h",
        "movement": {"direction": "North-Northwest", "speed_kmh": 4},
        "intensity_trend": "Weakening"
    }
}


async def insert_sample_forecast():
    """Insert sample forecast data for NOWLIVE1234 storm"""
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
    )
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Check if forecast already exists
            from sqlalchemy import select
            result = await session.execute(
                select(Forecast).where(Forecast.storm_id == "NOWLIVE1234")
            )
            existing = result.scalars().first()
            
            if existing:
                print("⚠️  Forecast for NOWLIVE1234 already exists. Updating...")
                existing.nchmf = SAMPLE_FORECAST_DATA
                existing.jtwc = SAMPLE_JTWC_DATA
                print("✅ Updated existing forecast")
            else:
                # Create new forecast
                forecast = Forecast(
                    storm_id="NOWLIVE1234",
                    nchmf=SAMPLE_FORECAST_DATA,
                    jtwc=SAMPLE_JTWC_DATA
                )
                session.add(forecast)
                print("✅ Created new forecast")
            
            await session.commit()
            print("\n🎉 Sample forecast data inserted successfully!")
            print(f"   Storm ID: NOWLIVE1234")
            print(f"   NCHMF: {len(SAMPLE_FORECAST_DATA['forecast'])} forecast periods")
            print(f"   JTWC: {len(SAMPLE_JTWC_DATA['forecast'])} forecast periods")
            
        except Exception as e:
            print(f"❌ Error inserting forecast: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    print("🚀 Inserting sample forecast data...")
    asyncio.run(insert_sample_forecast())
