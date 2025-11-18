from typing import Optional, List
from datetime import datetime
from fastapi import (
    APIRouter,
    Body,
    File,
    Form,
    Path,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from uuid import UUID
from src.dependencies import DBSession
from src.schemas import StormCreate, StormUpdate, StormResponse

from src.storms.service import StormService
service = StormService()
router = APIRouter(prefix="/api/v1/storms", tags=["storms"])


@router.post("/", response_model=StormResponse, status_code=status.HTTP_201_CREATED)
async def create_storm(
    storm: StormCreate = Body(...),
    session: DBSession = None,
):
    """Create a new storm"""
    result = await service.create_storm(session=session, storm_data=storm.model_dump())
    return result


@router.get("/", response_model=List[StormResponse])
async def get_all_storms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    session: DBSession = None,
):
    """Get all storms with pagination"""
    storms = await service.get_all_storms(session=session, skip=skip, limit=limit)
    return storms


@router.get("/{storm_id}", response_model=StormResponse)
async def get_storm(
    storm_id: str = Path(...),
    session: DBSession = None,
):
    """Get a storm by ID"""
    storm = await service.get_storm(session=session, storm_id=storm_id)
    return storm


@router.put("/{storm_id}", response_model=StormResponse)
async def update_storm(
    storm_id: str = Path(...),
    storm: StormUpdate = Body(...),
    session: DBSession = None,
):
    """Update a storm by ID"""
    result = await service.update_storm(
        session=session,
        storm_id=storm_id,
        storm_data=storm.model_dump(exclude_unset=True)
    )
    return result


@router.delete("/{storm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_storm(
    storm_id: str = Path(...),
    session: DBSession = None,
):
    """Delete a storm by ID"""
    await service.delete_storm(session=session, storm_id=storm_id)
    return None
