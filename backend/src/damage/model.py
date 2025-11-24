from typing import Optional, List
from datetime import datetime
from src.models import DamageAssessment as DamageAssessmentDB

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class DamageAssessmentTables:
    async def create_damage_assessment(
        self,
        session: AsyncSession,
        storm_id: str,
        detail: dict,
        time: str
    ) -> DamageAssessmentDB:
        time_obj = datetime.strptime(time, "%d-%m-%Y %H:%M") if time else None
        
        new_damage = DamageAssessmentDB(
            storm_id=storm_id,
            detail=detail,
            time=time_obj
        )
        session.add(new_damage)
        await session.flush()
        await session.refresh(new_damage)
        return new_damage
    
    async def get_damage_by_id(
        self,
        session: AsyncSession,
        damage_id: int
    ) -> Optional[DamageAssessmentDB]:
        return await session.get(DamageAssessmentDB, damage_id)
    
    async def get_damage_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[DamageAssessmentDB]:
        query = select(DamageAssessmentDB).where(
            DamageAssessmentDB.storm_id == storm_id
        ).order_by(DamageAssessmentDB.time.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_latest_damage_by_storm(
        self,
        session: AsyncSession,
        storm_id: str
    ) -> Optional[DamageAssessmentDB]:
        query = select(DamageAssessmentDB).where(
            DamageAssessmentDB.storm_id == storm_id
        ).order_by(DamageAssessmentDB.time.desc()).limit(1)
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_damage(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[DamageAssessmentDB]:
        query = select(DamageAssessmentDB).order_by(
            DamageAssessmentDB.time.desc()
        ).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def update_damage(
        self,
        session: AsyncSession,
        damage_id: int,
        detail: Optional[dict] = None,
        time: Optional[str] = None
    ) -> Optional[DamageAssessmentDB]:
        damage = await self.get_damage_by_id(session, damage_id)
        if not damage:
            return None
        
        if detail is not None:
            damage.detail = detail
        if time is not None:
            damage.time = datetime.strptime(time, "%d-%m-%Y %H:%M")
        
        await session.flush()
        await session.refresh(damage)
        return damage
    
    async def delete_damage(
        self,
        session: AsyncSession,
        damage_id: int
    ) -> bool:
        damage = await self.get_damage_by_id(session, damage_id)
        if not damage:
            return False
        
        await session.delete(damage)
        await session.flush()
        return True


damage_assessments = DamageAssessmentTables()
