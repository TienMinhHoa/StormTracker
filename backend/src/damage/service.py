from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.damage.model import damage_assessments
from src.storms.model import storms
from src.models import DamageAssessment as DamageAssessmentDB


class DamageAssessmentService:
    async def create_damage(
        self,
        session: AsyncSession,
        damage_data: Dict[str, Any]
    ) -> DamageAssessmentDB:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, damage_data["storm_id"])
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {damage_data['storm_id']} not found"
            )
        
        result = await damage_assessments.create_damage_assessment(
            session=session,
            storm_id=damage_data["storm_id"],
            detail=damage_data["detail"],
            time=damage_data["time"]
        )
        return result
    
    async def get_damage(
        self,
        session: AsyncSession,
        damage_id: int
    ) -> DamageAssessmentDB:
        damage = await damage_assessments.get_damage_by_id(session, damage_id)
        if not damage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Damage assessment with id {damage_id} not found"
            )
        return damage
    
    async def get_damage_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[DamageAssessmentDB]:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, storm_id)
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return await damage_assessments.get_damage_by_storm(session, storm_id, skip, limit)
    
    async def get_latest_damage_by_storm(
        self,
        session: AsyncSession,
        storm_id: str
    ) -> DamageAssessmentDB:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, storm_id)
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        
        damage = await damage_assessments.get_latest_damage_by_storm(session, storm_id)
        if not damage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No damage assessment found for storm {storm_id}"
            )
        return damage
    
    async def get_all_damage(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[DamageAssessmentDB]:
        return await damage_assessments.get_all_damage(session, skip, limit)
    
    async def update_damage(
        self,
        session: AsyncSession,
        damage_id: int,
        damage_data: Dict[str, Any]
    ) -> DamageAssessmentDB:
        damage = await damage_assessments.update_damage(
            session=session,
            damage_id=damage_id,
            detail=damage_data.get("detail"),
            time=damage_data.get("time")
        )
        if not damage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Damage assessment with id {damage_id} not found"
            )
        return damage
    
    async def delete_damage(
        self,
        session: AsyncSession,
        damage_id: int
    ) -> bool:
        deleted = await damage_assessments.delete_damage(session, damage_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Damage assessment with id {damage_id} not found"
            )
        return deleted
