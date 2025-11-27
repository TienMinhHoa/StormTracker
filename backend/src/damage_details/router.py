from typing import List
from fastapi import APIRouter, Query, status

from src.dependencies import DBSession
from src.schemas import (
    DamageDetailCreate, 
    DamageDetailUpdate, 
    DamageDetailResponse,
    DamageTextProcessRequest,
    DamageTextProcessResponse
)
from src.damage_details.service import DamageDetailService
from src.damage_details.processing_service import damage_processing_service

router = APIRouter(prefix="/api/v1/damage-details", tags=["damage-details"])


@router.post(
    "",
    response_model=DamageDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new damage detail",
    description="Create a new damage detail entry for a specific storm"
)
async def create_damage_detail(
    damage_detail_data: DamageDetailCreate,
    db: DBSession
):
    """
    Create a new damage detail with the following fields:
    - **storm_id**: ID of the storm (foreign key)
    - **content**: JSON data containing damage details
    """
    return await DamageDetailService.create_damage_detail(db, damage_detail_data)


@router.get(
    "",
    response_model=List[DamageDetailResponse],
    summary="Get all damage details",
    description="Retrieve all damage details with pagination support"
)
async def get_all_damage_details(
    db: DBSession,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
):
    """
    Get all damage details with pagination.
    """
    return await DamageDetailService.get_all_damage_details(db, skip, limit)


@router.get(
    "/{damage_detail_id}",
    response_model=DamageDetailResponse,
    summary="Get damage detail by ID",
    description="Retrieve a specific damage detail by its ID"
)
async def get_damage_detail_by_id(
    damage_detail_id: int,
    db: DBSession
):
    """
    Get a specific damage detail by ID.
    """
    return await DamageDetailService.get_damage_detail_by_id(db, damage_detail_id)


@router.get(
    "/storm/{storm_id}",
    response_model=List[DamageDetailResponse],
    summary="Get damage details by storm ID",
    description="Retrieve all damage details for a specific storm"
)
async def get_damage_details_by_storm(
    storm_id: str,
    db: DBSession,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
):
    """
    Get all damage details for a specific storm with pagination.
    """
    return await DamageDetailService.get_damage_details_by_storm(db, storm_id, skip, limit)


@router.put(
    "/{damage_detail_id}",
    response_model=DamageDetailResponse,
    summary="Update a damage detail",
    description="Update an existing damage detail's content"
)
async def update_damage_detail(
    damage_detail_id: int,
    damage_detail_data: DamageDetailUpdate,
    db: DBSession
):
    """
    Update an existing damage detail. The content field will be updated.
    """
    return await DamageDetailService.update_damage_detail(db, damage_detail_id, damage_detail_data)


@router.delete(
    "/{damage_detail_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a damage detail",
    description="Delete a specific damage detail by its ID"
)
async def delete_damage_detail(
    damage_detail_id: int,
    db: DBSession
):
    """
    Delete a damage detail by ID.
    """
    return await DamageDetailService.delete_damage_detail(db, damage_detail_id)


@router.post(
    "/process-text",
    response_model=DamageTextProcessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process damage text and extract to database",
    description="Extract damage information from Vietnamese text, geocode locations, and save to database"
)
async def process_damage_text(
    request: DamageTextProcessRequest,
    db: DBSession
):
    """
    Process Vietnamese text describing damages and automatically:
    1. Extract damage information by location using LLM
    2. Convert location names to latitude/longitude coordinates
    3. Save structured data to database with location key as "lat-lon"
    
    Example input text:
    ```
    Tại Hà Nội có 100 nhà bị ngập lụt, 5 người chết, mất điện toàn bộ quận Hoàn Kiếm.
    Quảng Ninh có 50 ngôi nhà bị tốc mái, cây đổ la liệt trên đường.
    ```
    
    Returns the list of created damage records with their location coordinates.
    """
    damage_records = await damage_processing_service.process_and_save_damage_text(
        db=db,
        storm_id=request.storm_id,
        damage_text=request.damage_text
    )
    
    return DamageTextProcessResponse(
        success=True,
        message=f"Successfully processed and saved {len(damage_records)} damage records",
        records_created=len(damage_records),
        damage_records=damage_records
    )
