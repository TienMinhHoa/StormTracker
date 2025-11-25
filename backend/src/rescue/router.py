from typing import List, Annotated
from fastapi import (
    APIRouter,
    Body,
    Depends,
    Path,
    Query,
    status,
)
from src.dependencies import DBSession
from src.schemas import (
    RescueRequestCreate,
    RescueRequestUpdate,
    RescueRequestResponse,
    PaginationRequest
)

from src.rescue.service import RescueRequestService

service = RescueRequestService()
router = APIRouter(prefix="/api/v1/rescue", tags=["rescue-requests"])


@router.post("/", response_model=RescueRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_rescue_request(
    request: RescueRequestCreate = Body(...),
    session: DBSession = None,
):
    """Create a new rescue request"""
    result = await service.create_rescue_request(session=session, request_data=request.model_dump())
    return result


@router.get("/", response_model=List[RescueRequestResponse])
async def get_all_rescue_requests(
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all rescue requests with pagination"""
    requests_list = await service.get_all_rescue_requests(session=session, skip=pagination.skip, limit=pagination.limit)
    return requests_list


@router.get("/storm/{storm_id}", response_model=List[RescueRequestResponse])
async def get_requests_by_storm(
    storm_id: str,
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all rescue requests for a specific storm"""
    requests_list = await service.get_requests_by_storm(
        session=session,
        storm_id=storm_id,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return requests_list


@router.get("/status/{status_filter}", response_model=List[RescueRequestResponse])
async def get_requests_by_status(
    status_filter: str,
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get rescue requests by status"""
    requests_list = await service.get_requests_by_status(
        session=session,
        status_filter=status_filter,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return requests_list


@router.get("/priority/{priority}", response_model=List[RescueRequestResponse])
async def get_requests_by_priority(
    priority: int,
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get rescue requests by priority level"""
    requests_list = await service.get_requests_by_priority(
        session=session,
        priority=priority,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return requests_list


@router.get("/verified", response_model=List[RescueRequestResponse])
async def get_verified_requests(
    pagination: Annotated[PaginationRequest, Depends()],
    verified: bool = Query(True, description="Filter by verified status"),
    session: DBSession = None,
):
    """Get verified or unverified rescue requests"""
    requests_list = await service.get_verified_requests(
        session=session,
        verified=verified,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return requests_list


@router.get("/{request_id}", response_model=RescueRequestResponse)
async def get_rescue_request(
    request_id: int = Path(...),
    session: DBSession = None,
):
    """Get a rescue request by ID"""
    request = await service.get_rescue_request(session=session, request_id=request_id)
    return request


@router.put("/{request_id}", response_model=RescueRequestResponse)
async def update_rescue_request(
    request_id: int = Path(...),
    request: RescueRequestUpdate = Body(...),
    session: DBSession = None,
):
    """Update a rescue request by ID"""
    result = await service.update_rescue_request(
        session=session,
        request_id=request_id,
        request_data=request.model_dump(exclude_unset=True)
    )
    return result


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rescue_request(
    request_id: int = Path(...),
    session: DBSession = None,
):
    """Delete a rescue request by ID"""
    await service.delete_rescue_request(session=session, request_id=request_id)
    return None
