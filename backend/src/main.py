from fastapi import FastAPI, Request, Response, status
from fastapi.concurrency import asynccontextmanager
from src.logger import logger
from src.config import config
from src.database import engine, check_database
from datetime import datetime, timezone
import socket

from src.storms.router import router as storms_router
from src.news.router import router as news_router
from src.damage.router import router as damage_router
from src.rescue.router import router as rescue_router
from src.chatbot.router import router as chatbot_router
from src.forecasts.router import router as forecasts_router
from src.damage_details.router import router as damage_details_router

from src.schemas import HealthResponse
START_TIME = datetime.now(timezone.utc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 FastAPI application starting up...")
    logger.debug("Startup checks completed.")
    yield
    logger.info("🛑 FastAPI application shutting down...")
    await engine.dispose()
    logger.info("Database connections closed.")
    
    
app = FastAPI(title=config.APP_NAME, lifespan=lifespan)

app.include_router(storms_router)
app.include_router(news_router)
app.include_router(damage_router)
app.include_router(rescue_router)
app.include_router(chatbot_router)
app.include_router(forecasts_router)
app.include_router(damage_details_router)


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    description=(
        "Check overall service health. Returns a JSON payload with:\n\n"
        "- status: overall service status ('ok' when healthy)\n"
        "- db: database connectivity status ('ok' or 'down')\n"
        "- timestamp: current ISO8601 timestamp (UTC)\n"
        "- environment: application environment\n"
        "- version: application version\n"
        "- uptime_seconds: seconds since the app started\n"
        "- hostname: machine hostname\n\n"
        "Useful for monitoring and readiness checks. If critical dependencies are unavailable "
        "the service may return a degraded status."
    ),
    operation_id="getHealth",
    responses={
        status.HTTP_200_OK: {
            "description": "Service is healthy; returns health payload.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "db": "ok",
                        "timestamp": "2025-11-15T12:34:56.789Z",
                        "environment": "production",
                        "version": "1.2.3",
                        "uptime_seconds": 3600,
                        "hostname": "realtor-omni-agent-01",
                    }
                }
            },
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "Service degraded or dependency (e.g. database) unavailable.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "degraded",
                        "db": "down",
                        "timestamp": "2025-11-15T12:34:56.789Z",
                        "environment": "production",
                        "version": "1.2.3",
                        "uptime_seconds": 3600,
                        "hostname": "realtor-omni-agent-01",
                    }
                }
            },
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Unexpected server error."
        },
    },
)
async def health_check():
    uptime = (datetime.now(timezone.utc) - START_TIME).total_seconds()
    db_ok = await check_database()
    health = {
        "status": "ok" if db_ok else "degraded",
        "db": "ok" if db_ok else "down",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": config.APP_ENV.value,
        "version": config.APP_VERSION,
        "uptime_seconds": int(uptime),
        "hostname": socket.gethostname(),
    }
    return health