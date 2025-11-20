import asyncio
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.news.model import news_sources
from src.storms.model import storms
from src.models import NewsSource as NewsSourceDB


class NewsSourceService:
    async def create_news(
        self,
        session: AsyncSession,
        news_data: Dict[str, Any]
    ) -> NewsSourceDB:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, news_data["storm_id"])
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {news_data['storm_id']} not found"
            )
        
        result = await news_sources.create_news_source(
            session=session,
            storm_id=news_data["storm_id"],
            title=news_data["title"],
            content=news_data["content"],
            source_url=news_data["source_url"],
            published_at=news_data["published_at"],
            lat=news_data.get("lat"),
            lon=news_data.get("lon"),
            fatalities=news_data.get("fatalities"),
            injured=news_data.get("injured"),
            damage_estimate=news_data.get("damage_estimate")
        )
        return result
    
    async def get_news(
        self,
        session: AsyncSession,
        news_id: int
    ) -> NewsSourceDB:
        news = await news_sources.get_news_by_id(session, news_id)
        if not news:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"News with id {news_id} not found"
            )
        return news
    
    async def get_news_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[NewsSourceDB]:
        # Verify storm exists
        storm = await storms.get_storm_by_id(session, storm_id)
        if not storm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Storm with id {storm_id} not found"
            )
        return await news_sources.get_news_by_storm(session, storm_id, skip, limit)
    
    async def get_all_news(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[NewsSourceDB]:
        return await news_sources.get_all_news(session, skip, limit)
    
    async def update_news(
        self,
        session: AsyncSession,
        news_id: int,
        news_data: Dict[str, Any]
    ) -> NewsSourceDB:
        news = await news_sources.update_news(
            session=session,
            news_id=news_id,
            title=news_data.get("title"),
            content=news_data.get("content"),
            source_url=news_data.get("source_url"),
            published_at=news_data.get("published_at"),
            lat=news_data.get("lat"),
            lon=news_data.get("lon"),
            fatalities=news_data.get("fatalities"),
            injured=news_data.get("injured"),
            damage_estimate=news_data.get("damage_estimate")
        )
        if not news:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"News with id {news_id} not found"
            )
        return news
    
    async def delete_news(
        self,
        session: AsyncSession,
        news_id: int
    ) -> bool:
        deleted = await news_sources.delete_news(session, news_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"News with id {news_id} not found"
            )
        return deleted
