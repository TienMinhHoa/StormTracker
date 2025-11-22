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


# StormTrack Schemas
class StormTrackCreate(BaseModel):
    storm_id: str
    timestamp: str  # Format: "DD-MM-YYYY HH:MM"
    lat: float
    lon: float
    category: Optional[int] = None
    wind_speed: Optional[float] = None


class StormTrackUpdate(BaseModel):
    timestamp: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"
    lat: Optional[float] = None
    lon: Optional[float] = None
    category: Optional[int] = None
    wind_speed: Optional[float] = None


class StormTrackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    track_id: int
    storm_id: str
    timestamp: datetime
    lat: float
    lon: float
    category: Optional[int] = None
    wind_speed: Optional[float] = None


# NewsSource Schemas
class NewsSourceCreate(BaseModel):
    storm_id: str
    title: str
    content: str
    source_url: str
    published_at: str  # Format: "DD-MM-YYYY HH:MM"
    lat: Optional[float] = None
    lon: Optional[float] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None


class NewsSourceUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    source_url: Optional[str] = None
    published_at: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"
    lat: Optional[float] = None
    lon: Optional[float] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None


class NewsSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    news_id: int
    storm_id: str
    title: str
    content: str
    source_url: str
    published_at: datetime
    lat: Optional[float] = None
    lon: Optional[float] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None


# Request Models for Query Parameters
class PaginationRequest(BaseModel):
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(100, ge=1, le=1000, description="Maximum number of records to return")


class TrackPaginationRequest(BaseModel):
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(1000, ge=1, le=5000, description="Maximum number of records to return")