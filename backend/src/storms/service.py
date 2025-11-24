import asyncio
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.storms.model import storms, storm_tracks
from src.models import Storm as StormDB, StormTrack as StormTrackDB

class StormService:
    async def create_storm(
        self,
        session: AsyncSession,
        storm_data: Dict[str, Any]
    ) -> StormDB:
        result = await storms.create_new_storm(
            session=session,
            storm_id=storm_data["storm_id"],
            name=storm_data["name"],
            start_date=storm_data["start_date"],
            end_date=storm_data.get("end_date"),
            description=storm_data.get("description")
        )
        return result
    
    async def get_storm(
        self,
        session: AsyncSession,
        storm_id: str
    ) -> StormDB:
        storm = await storms.get_storm_by_id(session, storm_id)
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return storm
    
    async def get_all_storms(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[StormDB]:
        return await storms.get_all_storms(session, skip, limit)
    
    async def update_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        storm_data: Dict[str, Any]
    ) -> StormDB:
        storm = await storms.update_storm(
            session=session,
            storm_id=storm_id,
            name=storm_data.get("name"),
            start_date=storm_data.get("start_date"),
            end_date=storm_data.get("end_date"),
            description=storm_data.get("description")
        )
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return storm
    
    async def delete_storm(
        self,
        session: AsyncSession,
        storm_id: str
    ) -> bool:
        deleted = await storms.delete_storm(session, storm_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return deleted


class StormTrackService:
    async def create_track(
        self,
        session: AsyncSession,
        track_data: Dict[str, Any]
    ) -> StormTrackDB:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, track_data["storm_id"])
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {track_data['storm_id']} not found"
            )
        
        result = await storm_tracks.create_storm_track(
            session=session,
            storm_id=track_data["storm_id"],
            timestamp=track_data["timestamp"],
            lat=track_data["lat"],
            lon=track_data["lon"],
            category=track_data.get("category"),
            wind_speed=track_data.get("wind_speed")
        )
        return result
    
    async def get_track(
        self,
        session: AsyncSession,
        track_id: int
    ) -> StormTrackDB:
        track = await storm_tracks.get_track_by_id(session, track_id)
        if not track:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm track with id {track_id} not found"
            )
        return track
    
    async def get_tracks_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 1000
    ) -> List[StormTrackDB]:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, storm_id)
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return await storm_tracks.get_tracks_by_storm(session, storm_id, skip, limit)
    
    async def get_all_tracks(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 1000
    ) -> List[StormTrackDB]:
        return await storm_tracks.get_all_tracks(session, skip, limit)
    
    async def update_track(
        self,
        session: AsyncSession,
        track_id: int,
        track_data: Dict[str, Any]
    ) -> StormTrackDB:
        track = await storm_tracks.update_track(
            session=session,
            track_id=track_id,
            timestamp=track_data.get("timestamp"),
            lat=track_data.get("lat"),
            lon=track_data.get("lon"),
            category=track_data.get("category"),
            wind_speed=track_data.get("wind_speed")
        )
        if not track:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm track with id {track_id} not found"
            )
        return track
    
    async def delete_track(
        self,
        session: AsyncSession,
        track_id: int
    ) -> bool:
        deleted = await storm_tracks.delete_track(session, track_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm track with id {track_id} not found"
            )
        return deleted