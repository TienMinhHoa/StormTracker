from typing import Optional, List, Annotated
from datetime import datetime
from fastapi import (
    APIRouter,
    Body,
    Depends,
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
from src.schemas import (
    StormCreate, StormUpdate, StormResponse,
    StormTrackCreate, StormTrackUpdate, StormTrackResponse,
    PaginationRequest, TrackPaginationRequest
)

from src.storms.service import StormService, StormTrackService
service = StormService()
track_service = StormTrackService()
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
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all storms with pagination"""
    storms = await service.get_all_storms(session=session, skip=pagination.skip, limit=pagination.limit)
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


# StormTrack endpoints
@router.post("/{storm_id}/tracks", response_model=StormTrackResponse, status_code=status.HTTP_201_CREATED)
async def create_storm_track(
    storm_id: str = Path(...),
    track: StormTrackCreate = Body(...),
    session: DBSession = None,
):
    """Create a new storm track for a specific storm"""
    track_data = track.model_dump()
    track_data["storm_id"] = storm_id  # Override with path parameter
    result = await track_service.create_track(session=session, track_data=track_data)
    return result


@router.get("/{storm_id}/tracks", response_model=List[StormTrackResponse])
async def get_storm_tracks(
    storm_id: str,
    pagination: Annotated[TrackPaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all tracks for a specific storm"""
    tracks = await track_service.get_tracks_by_storm(
        session=session,
        storm_id=storm_id,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return tracks


@router.get("/tracks/all", response_model=List[StormTrackResponse])
async def get_all_storm_tracks(
    pagination: Annotated[TrackPaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all storm tracks across all storms"""
    tracks = await track_service.get_all_tracks(session=session, skip=pagination.skip, limit=pagination.limit)
    return tracks


@router.get("/tracks/{track_id}", response_model=StormTrackResponse)
async def get_storm_track(
    track_id: int = Path(...),
    session: DBSession = None,
):
    """Get a specific storm track by ID"""
    track = await track_service.get_track(session=session, track_id=track_id)
    return track


@router.put("/tracks/{track_id}", response_model=StormTrackResponse)
async def update_storm_track(
    track_id: int = Path(...),
    track: StormTrackUpdate = Body(...),
    session: DBSession = None,
):
    """Update a storm track by ID"""
    result = await track_service.update_track(
        session=session,
        track_id=track_id,
        track_data=track.model_dump(exclude_unset=True)
    )
    return result


@router.delete("/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_storm_track(
    track_id: int = Path(...),
    session: DBSession = None,
):
    """Delete a storm track by ID"""
    await track_service.delete_track(session=session, track_id=track_id)
    return None
