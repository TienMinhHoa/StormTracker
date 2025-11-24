from typing import List, Annotated
from fastapi import (
    APIRouter,
    Body,
    Depends,
    Path,
    status,
)
from src.dependencies import DBSession
from src.schemas import (
    DamageAssessmentCreate,
    DamageAssessmentUpdate,
    DamageAssessmentResponse,
    PaginationRequest
)

from src.damage.service import DamageAssessmentService

service = DamageAssessmentService()
router = APIRouter(prefix="/api/v1/damage", tags=["damage-assessments"])


@router.post("/", response_model=DamageAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_damage(
    damage: DamageAssessmentCreate = Body(...),
    session: DBSession = None,
):
    """Create a new damage assessment"""
    result = await service.create_damage(session=session, damage_data=damage.model_dump())
    return result


@router.get("/", response_model=List[DamageAssessmentResponse])
async def get_all_damage(
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all damage assessments with pagination"""
    damage_list = await service.get_all_damage(session=session, skip=pagination.skip, limit=pagination.limit)
    return damage_list


@router.get("/storm/{storm_id}", response_model=List[DamageAssessmentResponse])
async def get_damage_by_storm(
    storm_id: str,
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all damage assessments for a specific storm"""
    damage_list = await service.get_damage_by_storm(
        session=session,
        storm_id=storm_id,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return damage_list


@router.get("/storm/{storm_id}/latest", response_model=DamageAssessmentResponse)
async def get_latest_damage_by_storm(
    storm_id: str,
    session: DBSession = None,
):
    """Get the latest damage assessment for a specific storm"""
    damage = await service.get_latest_damage_by_storm(session=session, storm_id=storm_id)
    return damage


@router.get("/{damage_id}", response_model=DamageAssessmentResponse)
async def get_damage(
    damage_id: int = Path(...),
    session: DBSession = None,
):
    """Get a damage assessment by ID"""
    damage = await service.get_damage(session=session, damage_id=damage_id)
    return damage


@router.put("/{damage_id}", response_model=DamageAssessmentResponse)
async def update_damage(
    damage_id: int = Path(...),
    damage: DamageAssessmentUpdate = Body(...),
    session: DBSession = None,
):
    """Update a damage assessment by ID"""
    result = await service.update_damage(
        session=session,
        damage_id=damage_id,
        damage_data=damage.model_dump(exclude_unset=True)
    )
    return result


@router.delete("/{damage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_damage(
    damage_id: int = Path(...),
    session: DBSession = None,
):
    """Delete a damage assessment by ID"""
    await service.delete_damage(session=session, damage_id=damage_id)
    return None
