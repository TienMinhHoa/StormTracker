import enum
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy import (
    Column,
    JSON,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    String,
    Date,
    UniqueConstraint,
    Uuid,
    func,
    Float,
    BigInteger,
    Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Storm(Base):
    __tablename__ = "storms"

    storm_id = Column(String, primary_key=True)
    name = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    description = Column(Text)

    # Relationships
    tracks = relationship("StormTrack", back_populates="storm")
    news = relationship("NewsSource", back_populates="storm")
    social_posts = relationship("SocialPost", back_populates="storm")
    rescue_requests = relationship("RescueRequest", back_populates="storm")
    damage_assessments = relationship("DamageAssessment", back_populates="storm")
    forecasts = relationship("Forecast", back_populates="storm")
    location_damages = relationship("LocationDamage", back_populates="storm")
    damage_details = relationship("DamageDetail", back_populates="storm")
    
    
class StormTrack(Base):
    __tablename__ = "storm_tracks"

    track_id = Column(Integer, primary_key=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"))
    timestamp = Column(DateTime)
    lat = Column(Float)
    lon = Column(Float)
    category = Column(Integer)
    wind_speed = Column(Float)

    storm = relationship("Storm", back_populates="tracks")
    
class NewsSource(Base):
    __tablename__ = "news_sources"

    news_id = Column(Integer, primary_key=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"))
    title = Column(Text)
    content = Column(Text)
    source_url = Column(Text)
    published_at = Column(DateTime)
    lat = Column(Float)
    lon = Column(Float)
    thumbnail_url = Column(Text)
    category = Column(Text)

    storm = relationship("Storm", back_populates="news")



class SourceEnum(enum.Enum):
    TWITTER = "twitter"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    UNKNOWN = "unknown"

class SocialPost(Base):
    __tablename__ = "social_posts"

    post_id = Column(Integer, primary_key=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"))
    content = Column(Text)
    platform = Column(String)
    author = Column(String)
    posted_at = Column(DateTime)
    lat = Column(Float)
    lon = Column(Float)
    phone = Column(String)
    is_valid = Column(Boolean)
    source = Column(Enum(SourceEnum))

    storm = relationship("Storm", back_populates="social_posts")    


class RescueRequest(Base):
    __tablename__ = "rescue_requests"

    request_id = Column(Integer, primary_key=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"))
    name = Column(String)
    phone = Column(String)
    address = Column(Text)
    lat = Column(Float)
    lon = Column(Float)
    priority = Column(Integer)  # Renamed from severity
    status = Column(String)
    type = Column(Text)
    people_detail = Column(JSON)
    verified = Column(Boolean)
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    storm = relationship("Storm", back_populates="rescue_requests")



class DamageAssessment(Base):
    __tablename__ = "damage_assessment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"), nullable=False)
    detail = Column(JSON, nullable=False)  # Chứa toàn bộ thông tin damage dạng JSON
    time = Column(DateTime, nullable=False)  # Thời gian thu thập thông tin
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    storm = relationship("Storm", back_populates="damage_assessments")


class Forecast(Base):
    __tablename__ = "forecasts"

    forecast_id = Column(Integer, primary_key=True, autoincrement=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"), nullable=False)
    nchmf = Column(JSON)  # JSON từ Trung tâm Khí tượng Thuỷ văn
    jtwc = Column(JSON)   # JSON từ JTWC (Joint Typhoon Warning Center)
    created_at = Column(DateTime, server_default=func.now())

    storm = relationship("Storm", back_populates="forecasts")


class LiveTracking(Base):
    __tablename__ = "live_tracking"

    tracking_id = Column(Integer, primary_key=True, autoincrement=True)
    live_id = Column(String, nullable=False, index=True)  # e.g., NOWLIVE1234
    storm_id = Column(String, ForeignKey("storms.storm_id"), nullable=True)
    timestamp = Column(DateTime, nullable=False)
    lat = Column(Float)
    lon = Column(Float)
    status = Column(String)  # active, inactive, warning, etc.
    data = Column(JSON)  # Additional live data in JSON format
    created_at = Column(DateTime, server_default=func.now())

    storm = relationship("Storm")


class LocationDamage(Base):
    __tablename__ = "location_damages"

    location_key = Column(String, primary_key=True)  # Format: "lat-lon"
    storm_id = Column(String, ForeignKey("storms.storm_id"), nullable=False)
    content = Column(JSON, nullable=False)  # JSON chứa chi tiết thiệt hại tại vị trí
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    storm = relationship("Storm", back_populates="location_damages")


class DamageDetail(Base):
    __tablename__ = "damage_details"

    id = Column(Integer, primary_key=True, autoincrement=True)
    storm_id = Column(String, ForeignKey("storms.storm_id"), nullable=False)
    content = Column(JSON, nullable=False)  # JSON chứa chi tiết thiệt hại
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    modified_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    storm = relationship("Storm", back_populates="damage_details")
