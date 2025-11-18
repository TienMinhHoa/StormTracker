from typing import AsyncGenerator, Annotated

from src.database import AsyncSessionLocal

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()


DBSession = Annotated[AsyncSession, Depends(get_db_session)]

__all__ = ["DBSession"]