from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.rescue.model import rescue_requests
from src.storms.model import storms
from src.models import RescueRequest as RescueRequestDB


class RescueRequestService:
    async def create_rescue_request(
        self,
        session: AsyncSession,
        request_data: Dict[str, Any]
    ) -> RescueRequestDB:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, request_data["storm_id"])
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {request_data['storm_id']} not found"
            )
        
        result = await rescue_requests.create_rescue_request(
            session=session,
            storm_id=request_data["storm_id"],
            name=request_data.get("name"),
            phone=request_data.get("phone"),
            address=request_data.get("address"),
            lat=request_data.get("lat"),
            lon=request_data.get("lon"),
            priority=request_data.get("priority"),
            status=request_data.get("status"),
            type=request_data.get("type"),
            people_detail=request_data.get("people_detail"),
            verified=request_data.get("verified", False),
            note=request_data.get("note")
        )
        return result
    
    async def get_rescue_request(
        self,
        session: AsyncSession,
        request_id: int
    ) -> RescueRequestDB:
        request = await rescue_requests.get_request_by_id(session, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rescue request with id {request_id} not found"
            )
        return request
    
    async def get_requests_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, storm_id)
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return await rescue_requests.get_requests_by_storm(session, storm_id, skip, limit)
    
    async def get_requests_by_status(
        self,
        session: AsyncSession,
        status_filter: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        return await rescue_requests.get_requests_by_status(session, status_filter, skip, limit)
    
    async def get_requests_by_priority(
        self,
        session: AsyncSession,
        priority: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        return await rescue_requests.get_requests_by_priority(session, priority, skip, limit)
    
    async def get_verified_requests(
        self,
        session: AsyncSession,
        verified: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        return await rescue_requests.get_verified_requests(session, verified, skip, limit)
    
    async def get_all_rescue_requests(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        return await rescue_requests.get_all_requests(session, skip, limit)
    
    async def update_rescue_request(
        self,
        session: AsyncSession,
        request_id: int,
        request_data: Dict[str, Any]
    ) -> RescueRequestDB:
        request = await rescue_requests.update_request(
            session=session,
            request_id=request_id,
            name=request_data.get("name"),
            phone=request_data.get("phone"),
            address=request_data.get("address"),
            lat=request_data.get("lat"),
            lon=request_data.get("lon"),
            priority=request_data.get("priority"),
            status=request_data.get("status"),
            type=request_data.get("type"),
            people_detail=request_data.get("people_detail"),
            verified=request_data.get("verified"),
            note=request_data.get("note")
        )
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rescue request with id {request_id} not found"
            )
        return request
    
    async def delete_rescue_request(
        self,
        session: AsyncSession,
        request_id: int
    ) -> bool:
        deleted = await rescue_requests.delete_request(session, request_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rescue request with id {request_id} not found"
            )
        return deleted
