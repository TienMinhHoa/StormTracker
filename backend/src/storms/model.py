from typing import Optional, List
from datetime import datetime
from datetime import datetime
from src.models import Storm as StormDB

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func


class StormTables:
    async def create_new_storm(
        self, 
        session: AsyncSession,
        storm_id: str,
        name: str,
        start_date: str,
        end_date: Optional[str] = None,
        description: Optional[str] = None
    ) -> StormDB:
        # Convert string dates to date objects
        start_date_obj = datetime.strptime(start_date, "%d-%m-%Y %H:%M") if start_date else None
        end_date_obj = datetime.strptime(end_date, "%d-%m-%Y %H:%M") if end_date else None
        
        new_storm = StormDB(
            storm_id=storm_id,
            name=name,
            start_date=start_date_obj,
            end_date=end_date_obj,
            description=description
        )
        session.add(new_storm)
        await session.flush()
        await session.refresh(new_storm)
        return new_storm
    
    async def get_storm_by_id(
        self,
        session: AsyncSession,
        storm_id: str
    ) -> Optional[StormDB]:
        return await session.get(StormDB, storm_id)
    
    async def get_all_storms(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[StormDB]:
        query = select(StormDB).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def update_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[StormDB]:
        storm = await self.get_storm_by_id(session, storm_id)
        if not storm:
            return None
        
        if name is not None:
            storm.name = name
        if start_date is not None:
            storm.start_date = datetime.strptime(start_date, "%d-%m-%Y %H:%M")
        if end_date is not None:
            storm.end_date = datetime.strptime(end_date, "%d-%m-%Y %H:%M")
        if description is not None:
            storm.description = description
        
        await session.flush()
        await session.refresh(storm)
        return storm
    
    async def delete_storm(
        self,
        session: AsyncSession,
        storm_id: str
    ) -> bool:
        storm = await self.get_storm_by_id(session, storm_id)
        if not storm:
            return False
        
        await session.delete(storm)
        await session.flush()
        return True
    
storms = StormTables()