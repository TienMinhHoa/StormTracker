from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from src.forecasts.model import ForecastModel
from src.schemas import ForecastCreate, ForecastUpdate, ForecastResponse


class ForecastService:
    """Service layer for Forecast business logic."""

    @staticmethod
    async def create_forecast(
        db: AsyncSession, 
        forecast_data: ForecastCreate
    ) -> ForecastResponse:
        """Create a new forecast."""
        # Verify storm exists
        storm_exists = await ForecastModel.verify_storm_exists(db, forecast_data.storm_id)
        if not storm_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id '{forecast_data.storm_id}' not found"
            )

        # Create forecast
        forecast = await ForecastModel.create(db, forecast_data.model_dump())
        return ForecastResponse.model_validate(forecast)

    @staticmethod
    async def get_forecast_by_id(
        db: AsyncSession, 
        forecast_id: int
    ) -> ForecastResponse:
        """Get a forecast by ID."""
        forecast = await ForecastModel.get_by_id(db, forecast_id)
        if not forecast:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Forecast with id {forecast_id} not found"
            )
        return ForecastResponse.model_validate(forecast)

    @staticmethod
    async def get_all_forecasts(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ForecastResponse]:
        """Get all forecasts with pagination."""
        forecasts = await ForecastModel.get_all(db, skip, limit)
        return [ForecastResponse.model_validate(f) for f in forecasts]

    @staticmethod
    async def get_forecasts_by_storm(
        db: AsyncSession, 
        storm_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ForecastResponse]:
        """Get all forecasts for a specific storm."""
        # Verify storm exists
        storm_exists = await ForecastModel.verify_storm_exists(db, storm_id)
        if not storm_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id '{storm_id}' not found"
            )

        forecasts = await ForecastModel.get_by_storm_id(db, storm_id, skip, limit)
        return [ForecastResponse.model_validate(f) for f in forecasts]

    @staticmethod
    async def get_latest_forecast_by_storm(
        db: AsyncSession, 
        storm_id: str
    ) -> Optional[ForecastResponse]:
        """Get the latest forecast for a specific storm."""
        # Verify storm exists
        storm_exists = await ForecastModel.verify_storm_exists(db, storm_id)
        if not storm_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id '{storm_id}' not found"
            )

        forecast = await ForecastModel.get_latest_by_storm_id(db, storm_id)
        if not forecast:
            return None
        return ForecastResponse.model_validate(forecast)

    @staticmethod
    async def update_forecast(
        db: AsyncSession, 
        forecast_id: int, 
        forecast_data: ForecastUpdate
    ) -> ForecastResponse:
        """Update an existing forecast."""
        # Filter out None values
        update_data = {k: v for k, v in forecast_data.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )

        forecast = await ForecastModel.update(db, forecast_id, update_data)
        if not forecast:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Forecast with id {forecast_id} not found"
            )
        
        return ForecastResponse.model_validate(forecast)

    @staticmethod
    async def delete_forecast(db: AsyncSession, forecast_id: int) -> dict:
        """Delete a forecast by ID."""
        deleted = await ForecastModel.delete(db, forecast_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Forecast with id {forecast_id} not found"
            )
        return {"message": f"Forecast {forecast_id} deleted successfully"}

    @staticmethod
    async def delete_forecasts_by_storm(db: AsyncSession, storm_id: str) -> dict:
        """Delete all forecasts for a specific storm."""
        # Verify storm exists
        storm_exists = await ForecastModel.verify_storm_exists(db, storm_id)
        if not storm_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id '{storm_id}' not found"
            )

        count = await ForecastModel.delete_by_storm_id(db, storm_id)
        return {
            "message": f"Deleted {count} forecast(s) for storm '{storm_id}'",
            "count": count
        }
