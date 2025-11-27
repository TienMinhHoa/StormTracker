from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from src.damage_details.model import damage_details
from src.schemas import DamageDetailCreate, DamageDetailUpdate, DamageDetailResponse
from src.models import Storm


class DamageDetailService:
    """Service layer for DamageDetail business logic."""

    @staticmethod
    async def verify_storm_exists(db: AsyncSession, storm_id: str) -> bool:
        """Verify if a storm exists."""
        storm = await db.get(Storm, storm_id)
        return storm is not None

    @staticmethod
    async def create_damage_detail(
        db: AsyncSession, 
        damage_detail_data: DamageDetailCreate
    ) -> DamageDetailResponse:
        """Create a new damage detail."""
        # Verify storm exists
        storm_exists = await DamageDetailService.verify_storm_exists(
            db, damage_detail_data.storm_id
        )
        if not storm_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id '{damage_detail_data.storm_id}' not found"
            )

        # Create damage detail
        damage_detail = await damage_details.create_damage_detail(
            db,
            storm_id=damage_detail_data.storm_id,
            content=damage_detail_data.content
        )
        await db.commit()
        return DamageDetailResponse.model_validate(damage_detail)

    @staticmethod
    async def get_damage_detail_by_id(
        db: AsyncSession, 
        damage_detail_id: int
    ) -> DamageDetailResponse:
        """Get a damage detail by ID."""
        damage_detail = await damage_details.get_damage_detail_by_id(db, damage_detail_id)
        if not damage_detail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Damage detail with id {damage_detail_id} not found"
            )
        return DamageDetailResponse.model_validate(damage_detail)

    @staticmethod
    async def get_all_damage_details(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[DamageDetailResponse]:
        """Get all damage details with pagination."""
        damage_detail_list = await damage_details.get_all_damage_details(db, skip, limit)
        return [DamageDetailResponse.model_validate(d) for d in damage_detail_list]

    @staticmethod
    async def get_damage_details_by_storm(
        db: AsyncSession, 
        storm_id: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[DamageDetailResponse]:
        """Get all damage details for a specific storm."""
        # Verify storm exists
        storm_exists = await DamageDetailService.verify_storm_exists(db, storm_id)
        if not storm_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id '{storm_id}' not found"
            )

        damage_detail_list = await damage_details.get_damage_details_by_storm(
            db, storm_id, skip, limit
        )
        return [DamageDetailResponse.model_validate(d) for d in damage_detail_list]

    @staticmethod
    async def update_damage_detail(
        db: AsyncSession, 
        damage_detail_id: int, 
        damage_detail_data: DamageDetailUpdate
    ) -> DamageDetailResponse:
        """Update an existing damage detail."""
        damage_detail = await damage_details.update_damage_detail(
            db,
            damage_detail_id=damage_detail_id,
            content=damage_detail_data.content
        )
        
        if not damage_detail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Damage detail with id {damage_detail_id} not found"
            )
        
        await db.commit()
        return DamageDetailResponse.model_validate(damage_detail)

    @staticmethod
    async def delete_damage_detail(db: AsyncSession, damage_detail_id: int) -> dict:
        """Delete a damage detail by ID."""
        deleted = await damage_details.delete_damage_detail(db, damage_detail_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Damage detail with id {damage_detail_id} not found"
            )
        await db.commit()
        return {"message": f"Damage detail {damage_detail_id} deleted successfully"}
