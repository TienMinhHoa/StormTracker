from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models import DamageDetail as DamageDetailDB


class DamageDetailTables:
    async def create_damage_detail(
        self,
        session: AsyncSession,
        storm_id: str,
        content: dict
    ) -> DamageDetailDB:
        new_damage_detail = DamageDetailDB(
            storm_id=storm_id,
            content=content
        )
        session.add(new_damage_detail)
        await session.flush()
        await session.refresh(new_damage_detail)
        return new_damage_detail
    
    async def get_damage_detail_by_id(
        self,
        session: AsyncSession,
        damage_detail_id: int
    ) -> Optional[DamageDetailDB]:
        return await session.get(DamageDetailDB, damage_detail_id)
    
    async def get_damage_details_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[DamageDetailDB]:
        query = select(DamageDetailDB).where(
            DamageDetailDB.storm_id == storm_id
        ).order_by(DamageDetailDB.created_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_all_damage_details(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[DamageDetailDB]:
        query = select(DamageDetailDB).order_by(
            DamageDetailDB.created_at.desc()
        ).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def update_damage_detail(
        self,
        session: AsyncSession,
        damage_detail_id: int,
        content: Optional[dict] = None
    ) -> Optional[DamageDetailDB]:
        damage_detail = await self.get_damage_detail_by_id(session, damage_detail_id)
        if not damage_detail:
            return None
        
        if content is not None:
            damage_detail.content = content
        
        await session.flush()
        await session.refresh(damage_detail)
        return damage_detail
    
    async def delete_damage_detail(
        self,
        session: AsyncSession,
        damage_detail_id: int
    ) -> bool:
        damage_detail = await self.get_damage_detail_by_id(session, damage_detail_id)
        if not damage_detail:
            return False
        
        await session.delete(damage_detail)
        await session.flush()
        return True


damage_details = DamageDetailTables()
