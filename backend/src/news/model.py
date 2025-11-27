from typing import Optional, List
from datetime import datetime
from src.models import NewsSource as NewsSourceDB

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func


class NewsSourceTables:
    async def create_news_source(
        self,
        session: AsyncSession,
        storm_id: str,
        title: str,
        content: str,
        source_url: str,
        published_at: str,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        thumbnail_url: Optional[str] = None,
        category: Optional[str] = None
    ) -> NewsSourceDB:
        published_at_obj = datetime.strptime(published_at, "%d-%m-%Y %H:%M") if published_at else None
        
        new_news = NewsSourceDB(
            storm_id=storm_id,
            title=title,
            content=content,
            source_url=source_url,
            published_at=published_at_obj,
            lat=lat,
            lon=lon,
            thumbnail_url=thumbnail_url,
            category=category
        )
        session.add(new_news)
        await session.flush()
        await session.refresh(new_news)
        return new_news
    
    async def get_news_by_id(
        self,
        session: AsyncSession,
        news_id: int
    ) -> Optional[NewsSourceDB]:
        return await session.get(NewsSourceDB, news_id)
    
    async def get_news_by_storm(
        self,
        session: AsyncSession,
        storm_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[NewsSourceDB]:
        query = select(NewsSourceDB).where(
            NewsSourceDB.storm_id == storm_id
        ).order_by(NewsSourceDB.published_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_news_by_storm_and_category(
        self,
        session: AsyncSession,
        storm_id: str,
        category: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[NewsSourceDB]:
        query = select(NewsSourceDB).where(
            NewsSourceDB.storm_id == storm_id,
            NewsSourceDB.category == category
        ).order_by(NewsSourceDB.published_at.desc()).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def get_all_news(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[NewsSourceDB]:
        query = select(NewsSourceDB).order_by(
            NewsSourceDB.published_at.desc()
        ).offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
    
    async def update_news(
        self,
        session: AsyncSession,
        news_id: int,
        title: Optional[str] = None,
        content: Optional[str] = None,
        source_url: Optional[str] = None,
        published_at: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        thumbnail_url: Optional[str] = None,
        category: Optional[str] = None,
        summary: Optional[str] = None
    ) -> Optional[NewsSourceDB]:
        news = await self.get_news_by_id(session, news_id)
        if not news:
            return None
        
        if title is not None:
            news.title = title
        if content is not None:
            news.content = content
        if source_url is not None:
            news.source_url = source_url
        if published_at is not None:
            news.published_at = datetime.strptime(published_at, "%d-%m-%Y %H:%M")
        if lat is not None:
            news.lat = lat
        if lon is not None:
            news.lon = lon
        if thumbnail_url is not None:
            news.thumbnail_url = thumbnail_url
        if category is not None:
            news.category = category
        if summary is not None:
            news.summary = summary
        
        await session.flush()
        await session.refresh(news)
        return news
    
    async def delete_news(
        self,
        session: AsyncSession,
        news_id: int
    ) -> bool:
        news = await self.get_news_by_id(session, news_id)
        if not news:
            return False
        
        await session.delete(news)
        await session.flush()
        return True


news_sources = NewsSourceTables()
