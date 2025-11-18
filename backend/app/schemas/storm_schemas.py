from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


# ========= ENUM =========
class SourceEnum(str, Enum):
    source_a = "source_a"
    source_b = "source_b"
    # sửa thành enum thực tế khi bạn biết


# ========= STORMS =========
class StormBase(BaseModel):
    name: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    description: Optional[str]


class StormCreate(StormBase):
    pass


class Storm(StormBase):
    storm_id: int

    class Config:
        from_attributes = True


# ========= STORM TRACKS =========
class StormTrackBase(BaseModel):
    storm_id: int
    timestamp: datetime
    lat: float
    lon: float
    category: int
    wind_speed: float


class StormTrackCreate(StormTrackBase):
    pass


class StormTrack(StormTrackBase):
    track_id: int

    class Config:
        from_attributes = True


# ========= NEWS SOURCES =========
class NewsSourceBase(BaseModel):
    storm_id: int
    title: Optional[str]
    content: Optional[str]
    source_url: Optional[str]
    published_at: datetime
    lat: float
    lon: float
    fatalities: Optional[int]
    injured: Optional[int]
    damage_estimate: Optional[int]


class NewsSourceCreate(NewsSourceBase):
    pass


class NewsSource(NewsSourceBase):
    news_id: int

    class Config:
        from_attributes = True


# ========= SOCIAL POSTS =========
class SocialPostBase(BaseModel):
    storm_id: int
    content: Optional[str]
    platform: Optional[str]
    author: Optional[str]
    posted_at: datetime
    lat: float
    lon: float
    phone: Optional[str]
    is_valid: Optional[bool]
    source: Optional[SourceEnum]


class SocialPostCreate(SocialPostBase):
    pass


class SocialPost(SocialPostBase):
    post_id: int

    class Config:
        from_attributes = True


# ========= RESCUE REQUESTS =========
class RescueRequestBase(BaseModel):
    storm_id: int
    social_post_id: Optional[int]
    phone: Optional[str]
    lat: float
    lon: float
    severity: int
    verified: Optional[bool]
    created_at: datetime


class RescueRequestCreate(RescueRequestBase):
    pass


class RescueRequest(RescueRequestBase):
    request_id: int

    class Config:
        from_attributes = True


# ========= DAMAGE ASSESSMENT =========
class DamageAssessmentBase(BaseModel):
    storm_id: int
    total_fatalities: Optional[int]
    total_injured: Optional[int]
    total_facilities: Optional[int]
    updated_at: datetime
    news_id: Optional[int]
    lat: float
    lon: float
    time: datetime


class DamageAssessmentCreate(DamageAssessmentBase):
    pass


class DamageAssessment(DamageAssessmentBase):
    id: int

    class Config:
        from_attributes = True
