from typing import List, Optional
from fastapi import APIRouter, Query, status

from src.dependencies import DBSession
from src.schemas import ForecastCreate, ForecastUpdate, ForecastResponse
from src.forecasts.service import ForecastService

router = APIRouter(prefix="/api/v1/forecasts", tags=["forecasts"])


@router.post(
    "",
    response_model=ForecastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new forecast",
    description="Create a new forecast entry with NCHMF and/or JTWC data for a specific storm"
)
async def create_forecast(
    forecast_data: ForecastCreate,
    db: DBSession
):
    """
    Create a new forecast with the following fields:
    - **storm_id**: ID of the storm (foreign key)
    - **nchmf**: JSON data from National Center for Hydro-Meteorological Forecasting (optional)
    - **jtwc**: JSON data from Joint Typhoon Warning Center (optional)
    """
    return await ForecastService.create_forecast(db, forecast_data)


@router.get(
    "",
    response_model=List[ForecastResponse],
    summary="Get all forecasts",
    description="Retrieve all forecasts with pagination support"
)
async def get_all_forecasts(
    db: DBSession,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
):
    """
    Get all forecasts with pagination.
    """
    return await ForecastService.get_all_forecasts(db, skip, limit)


@router.get(
    "/{forecast_id}",
    response_model=ForecastResponse,
    summary="Get forecast by ID",
    description="Retrieve a specific forecast by its ID"
)
async def get_forecast_by_id(
    forecast_id: int,
    db: DBSession
):
    """
    Get a specific forecast by ID.
    """
    return await ForecastService.get_forecast_by_id(db, forecast_id)


@router.get(
    "/storm/{storm_id}",
    response_model=List[ForecastResponse],
    summary="Get forecasts by storm ID",
    description="Retrieve all forecasts for a specific storm"
)
async def get_forecasts_by_storm(
    storm_id: str,
    db: DBSession,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
):
    """
    Get all forecasts for a specific storm with pagination.
    """
    return await ForecastService.get_forecasts_by_storm(db, storm_id, skip, limit)


@router.get(
    "/storm/{storm_id}/latest",
    response_model=Optional[ForecastResponse],
    summary="Get latest forecast for a storm",
    description="Retrieve the most recent forecast for a specific storm"
)
async def get_latest_forecast_by_storm(
    storm_id: str,
    db: DBSession
):
    """
    Get the latest forecast for a specific storm.
    Returns null if no forecasts exist for the storm.
    """
    return await ForecastService.get_latest_forecast_by_storm(db, storm_id)


@router.put(
    "/{forecast_id}",
    response_model=ForecastResponse,
    summary="Update a forecast",
    description="Update an existing forecast's NCHMF and/or JTWC data"
)
async def update_forecast(
    forecast_id: int,
    forecast_data: ForecastUpdate,
    db: DBSession
):
    """
    Update an existing forecast. Only provided fields will be updated.
    """
    return await ForecastService.update_forecast(db, forecast_id, forecast_data)


@router.delete(
    "/{forecast_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a forecast",
    description="Delete a specific forecast by its ID"
)
async def delete_forecast(
    forecast_id: int,
    db: DBSession
):
    """
    Delete a forecast by ID.
    """
    return await ForecastService.delete_forecast(db, forecast_id)


@router.delete(
    "/storm/{storm_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete all forecasts for a storm",
    description="Delete all forecasts associated with a specific storm"
)
async def delete_forecasts_by_storm(
    storm_id: str,
    db: DBSession
):
    """
    Delete all forecasts for a specific storm.
    Returns the count of deleted forecasts.
    """
    return await ForecastService.delete_forecasts_by_storm(db, storm_id)
