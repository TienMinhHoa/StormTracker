from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc

from src.models import Forecast, Storm


class ForecastModel:
    """Database operations for Forecast table."""

    @staticmethod
    async def create(db: AsyncSession, forecast_data: dict) -> Forecast:
        """Create a new forecast."""
        forecast = Forecast(**forecast_data)
        db.add(forecast)
        await db.flush()
        await db.refresh(forecast)
        return forecast

    @staticmethod
    async def get_by_id(db: AsyncSession, forecast_id: int) -> Optional[Forecast]:
        """Get forecast by ID."""
        return await db.get(Forecast, forecast_id)

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Forecast]:
        """Get all forecasts with pagination."""
        query = (
            select(Forecast)
            .order_by(desc(Forecast.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_storm_id(
        db: AsyncSession, 
        storm_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Forecast]:
        """Get all forecasts for a specific storm."""
        query = (
            select(Forecast)
            .where(Forecast.storm_id == storm_id)
            .order_by(desc(Forecast.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_latest_by_storm_id(
        db: AsyncSession, 
        storm_id: str
    ) -> Optional[Forecast]:
        """Get the latest forecast for a specific storm."""
        query = (
            select(Forecast)
            .where(Forecast.storm_id == storm_id)
            .order_by(desc(Forecast.created_at))
            .limit(1)
        )
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def update(
        db: AsyncSession, 
        forecast_id: int, 
        update_data: dict
    ) -> Optional[Forecast]:
        """Update forecast."""
        forecast = await ForecastModel.get_by_id(db, forecast_id)
        if not forecast:
            return None

        for key, value in update_data.items():
            if hasattr(forecast, key):
                setattr(forecast, key, value)

        await db.flush()
        await db.refresh(forecast)
        return forecast

    @staticmethod
    async def delete(db: AsyncSession, forecast_id: int) -> bool:
        """Delete a forecast by ID."""
        forecast = await ForecastModel.get_by_id(db, forecast_id)
        if not forecast:
            return False

        await db.delete(forecast)
        await db.flush()
        return True

    @staticmethod
    async def delete_by_storm_id(db: AsyncSession, storm_id: str) -> int:
        """Delete all forecasts for a specific storm."""
        query = delete(Forecast).where(Forecast.storm_id == storm_id)
        result = await db.execute(query)
        await db.flush()
        return result.rowcount

    @staticmethod
    async def verify_storm_exists(db: AsyncSession, storm_id: str) -> bool:
        """Verify if a storm exists."""
        storm = await db.get(Storm, storm_id)
        return storm is not None
