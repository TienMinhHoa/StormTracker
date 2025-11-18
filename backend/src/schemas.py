from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional
from datetime import datetime

class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "down"] = Field(
        ..., description="Overall service status"
    )
    db: Literal["ok", "down"] = Field(..., description="Database connectivity status")
    timestamp: datetime = Field(..., description="ISO8601 UTC timestamp")
    environment: str = Field(..., description="Application environment")
    version: str = Field(..., description="Application version")
    uptime_seconds: int = Field(..., description="Seconds since the app started")
    hostname: str = Field(..., description="Machine hostname")


class StormBase(BaseModel):
    name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None


class StormCreate(BaseModel):
    storm_id: str
    name: str
    start_date: str  # Format: "DD-MM-YYYY HH:MM"
    end_date: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"
    description: Optional[str] = None


class StormUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"
    end_date: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"
    description: Optional[str] = None


class StormResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    storm_id: str
    name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None