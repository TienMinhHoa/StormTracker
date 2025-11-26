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


# DamageAssessment Schemas
class DamageAssessmentCreate(BaseModel):
    storm_id: str
    detail: dict  # JSON chứa thông tin damage từ extract_damage_assesments.py
    time: str  # Format: "DD-MM-YYYY HH:MM"


class DamageAssessmentUpdate(BaseModel):
    detail: Optional[dict] = None
    time: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"


class DamageAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    storm_id: str
    detail: dict
    time: datetime
    created_at: datetime
    updated_at: datetime


# RescueRequest Schemas
class RescueRequestCreate(BaseModel):
    storm_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    priority: Optional[int] = None  # 1-5: 1=highest priority
    status: Optional[str] = None  # e.g., "pending", "in_progress", "completed"
    type: Optional[str] = None
    people_detail: Optional[dict] = None  # JSON with people information
    verified: Optional[bool] = False
    note: Optional[str] = None


class RescueRequestUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    type: Optional[str] = None
    people_detail: Optional[dict] = None
    verified: Optional[bool] = None
    note: Optional[str] = None


class RescueRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    request_id: int
    storm_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    type: Optional[str] = None
    people_detail: Optional[dict] = None
    verified: Optional[bool] = None
    note: Optional[str] = None
    created_at: datetime


# Forecast Schemas
class ForecastCreate(BaseModel):
    storm_id: str
    nchmf: Optional[dict] = None  # JSON data from National Center for Hydro-Meteorological Forecasting
    jtwc: Optional[dict] = None   # JSON data from Joint Typhoon Warning Center


class ForecastUpdate(BaseModel):
    nchmf: Optional[dict] = None
    jtwc: Optional[dict] = None


class ForecastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    forecast_id: int
    storm_id: str
    nchmf: Optional[dict] = None
    jtwc: Optional[dict] = None
    created_at: datetime


# LiveTracking Schemas
class LiveTrackingCreate(BaseModel):
    live_id: str
    storm_id: Optional[str] = None
    timestamp: str  # Format: "DD-MM-YYYY HH:MM"
    lat: Optional[float] = None
    lon: Optional[float] = None
    status: Optional[str] = None
    data: Optional[dict] = None


class LiveTrackingUpdate(BaseModel):
    storm_id: Optional[str] = None
    timestamp: Optional[str] = None  # Format: "DD-MM-YYYY HH:MM"
    lat: Optional[float] = None
    lon: Optional[float] = None
    status: Optional[str] = None
    data: Optional[dict] = None


class LiveTrackingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    tracking_id: int
    live_id: str
    storm_id: Optional[str] = None
    timestamp: datetime
    lat: Optional[float] = None
    lon: Optional[float] = None
    status: Optional[str] = None
    data: Optional[dict] = None
    created_at: datetime