from typing import Optional, List, Annotated
from datetime import datetime
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
    NewsSourceCreate, NewsSourceUpdate, NewsSourceResponse,
    PaginationRequest
)

from src.news.service import NewsSourceService

service = NewsSourceService()
router = APIRouter(prefix="/api/v1/news", tags=["news"])


@router.post("/", response_model=NewsSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_news(
    news: NewsSourceCreate = Body(...),
    session: DBSession = None,
):
    """Create a new news source"""
    result = await service.create_news(session=session, news_data=news.model_dump())
    return result


@router.get("/", response_model=List[NewsSourceResponse])
async def get_all_news(
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all news sources with pagination"""
    news_list = await service.get_all_news(session=session, skip=pagination.skip, limit=pagination.limit)
    return news_list


@router.get("/storm/{storm_id}", response_model=List[NewsSourceResponse])
async def get_news_by_storm(
    storm_id: str,
    pagination: Annotated[PaginationRequest, Depends()],
    session: DBSession = None,
):
    """Get all news sources for a specific storm"""
    news_list = await service.get_news_by_storm(
        session=session,
        storm_id=storm_id,
        skip=pagination.skip,
        limit=pagination.limit
    )
    return news_list


@router.get("/{news_id}", response_model=NewsSourceResponse)
async def get_news(
    news_id: int = Path(...),
    session: DBSession = None,
):
    """Get a news source by ID"""
    news = await service.get_news(session=session, news_id=news_id)
    return news


@router.put("/{news_id}", response_model=NewsSourceResponse)
async def update_news(
    news_id: int = Path(...),
    news: NewsSourceUpdate = Body(...),
    session: DBSession = None,
):
    """Update a news source by ID"""
    result = await service.update_news(
        session=session,
        news_id=news_id,
        news_data=news.model_dump(exclude_unset=True)
    )
    return result


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
    news_id: int = Path(...),
    session: DBSession = None,
):
    """Delete a news source by ID"""
    await service.delete_news(session=session, news_id=news_id)
    return None
