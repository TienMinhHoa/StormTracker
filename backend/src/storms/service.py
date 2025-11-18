import asyncio
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.storms.model import storms
from src.models import Storm as StormDB

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