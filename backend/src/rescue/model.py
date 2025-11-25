from typing import Optional, List
from datetime import datetime
from src.models import RescueRequest as RescueRequestDB

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class RescueRequestTables:
    async def create_rescue_request(
        self,
        session: AsyncSession,
        storm_id: str,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        priority: Optional[int] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        people_detail: Optional[dict] = None,
        verified: Optional[bool] = False,
        note: Optional[str] = None
    ) -> RescueRequestDB:
        new_request = RescueRequestDB(
            storm_id=storm_id,
            name=name,
            phone=phone,
            address=address,
            lat=lat,
            lon=lon,
            priority=priority,
            status=status,
            type=type,
            people_detail=people_detail,
            verified=verified,
            note=note
        )
        session.add(new_request)
        await session.flush()
        await session.refresh(new_request)
        return new_request
    
    async def get_request_by_id(
        self,
        session: AsyncSession,
        request_id: int
    ) -> Optional[RescueRequestDB]:
        return await session.get(RescueRequestDB, request_id)
    
    async def get_requests_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        query = select(RescueRequestDB).where(
            RescueRequestDB.storm_id == storm_id
        ).order_by(RescueRequestDB.created_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_requests_by_status(
        self,
        session: AsyncSession,
        status: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        query = select(RescueRequestDB).where(
            RescueRequestDB.status == status
        ).order_by(RescueRequestDB.created_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_requests_by_priority(
        self,
        session: AsyncSession,
        priority: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        query = select(RescueRequestDB).where(
            RescueRequestDB.priority == priority
        ).order_by(RescueRequestDB.created_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_verified_requests(
        self,
        session: AsyncSession,
        verified: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        query = select(RescueRequestDB).where(
            RescueRequestDB.verified == verified
        ).order_by(RescueRequestDB.created_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_all_requests(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[RescueRequestDB]:
        query = select(RescueRequestDB).order_by(
            RescueRequestDB.created_at.desc()
        ).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def update_request(
        self,
        session: AsyncSession,
        request_id: int,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        priority: Optional[int] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        people_detail: Optional[dict] = None,
        verified: Optional[bool] = None,
        note: Optional[str] = None
    ) -> Optional[RescueRequestDB]:
        request = await self.get_request_by_id(session, request_id)
        if not request:
            return None
        
        if name is not None:
            request.name = name
        if phone is not None:
            request.phone = phone
        if address is not None:
            request.address = address
        if lat is not None:
            request.lat = lat
        if lon is not None:
            request.lon = lon
        if priority is not None:
            request.priority = priority
        if status is not None:
            request.status = status
        if type is not None:
            request.type = type
        if people_detail is not None:
            request.people_detail = people_detail
        if verified is not None:
            request.verified = verified
        if note is not None:
            request.note = note
        
        await session.flush()
        await session.refresh(request)
        return request
    
    async def delete_request(
        self,
        session: AsyncSession,
        request_id: int
    ) -> bool:
        request = await self.get_request_by_id(session, request_id)
        if not request:
            return False
        
        await session.delete(request)
        await session.flush()
        return True


rescue_requests = RescueRequestTables()
