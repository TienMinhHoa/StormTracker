from sqlalchemy import Column, Integer, String, Date, Text, Float, Boolean, BigInteger, ForeignKey, Enum, TIMESTAMP
from sqlalchemy.orm import relationship
from databases import Base

class Storm(Base):
    __tablename__ = "storms"

    storm_id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    description = Column(Text)

    tracks = relationship("StormTrack", back_populates="storm")
    news = relationship("NewsSource", back_populates="storm")
    posts = relationship("SocialPost", back_populates="storm")
    rescue_requests = relationship("RescueRequest", back_populates="storm")
    damage_assessment = relationship("DamageAssessment", back_populates="storm")


class StormTrack(Base):
    __tablename__ = "storm_tracks"

    track_id = Column(Integer, primary_key=True, index=True)
    storm_id = Column(Integer, ForeignKey("storms.storm_id"))
    timestamp = Column(TIMESTAMP)
    lat = Column(Float)
    lon = Column(Float)
    category = Column(Integer)
    wind_speed = Column(Float)

    storm = relationship("Storm", back_populates="tracks")


class NewsSource(Base):
    __tablename__ = "news_sources"

    news_id = Column(Integer, primary_key=True)
    storm_id = Column(Integer, ForeignKey("storms.storm_id"))
    title = Column(Text)
    content = Column(Text)
    source_url = Column(Text)
    published_at = Column(TIMESTAMP)
    lat = Column(Float)
    lon = Column(Float)
    fatalities = Column(Integer)
    injured = Column(Integer)
    damage_estimate = Column(BigInteger)

    storm = relationship("Storm", back_populates="news")
    assessment = relationship("DamageAssessment", back_populates="news")


class SocialPost(Base):
    __tablename__ = "social_posts"

    post_id = Column(Integer, primary_key=True)
    storm_id = Column(Integer, ForeignKey("storms.storm_id"))
    content = Column(Text)
    platform = Column(String)
    author = Column(String)
    posted_at = Column(TIMESTAMP)
    lat = Column(Float)
    lon = Column(Float)
    phone = Column(String)
    is_valid = Column(Boolean)
    source = Column(String)

    storm = relationship("Storm", back_populates="posts")


class RescueRequest(Base):
    __tablename__ = "rescue_requests"

    request_id = Column(Integer, primary_key=True)
    storm_id = Column(Integer, ForeignKey("storms.storm_id"))
    social_post_id = Column(Integer, ForeignKey("social_posts.post_id"))
    phone = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    severity = Column(Integer)
    verified = Column(Boolean)
    created_at = Column(TIMESTAMP)

    storm = relationship("Storm", back_populates="rescue_requests")
    post = relationship("SocialPost")


class DamageAssessment(Base):
    __tablename__ = "damage_assessment"

    id = Column(Integer, primary_key=True)
    storm_id = Column(Integer, ForeignKey("storms.storm_id"))
    total_fatalities = Column(Integer)
    total_injured = Column(Integer)
    total_facilities = Column(Integer)
    updated_at = Column(TIMESTAMP)
    news_id = Column(Integer, ForeignKey("news_sources.news_id"))
    lat = Column(Float)
    lon = Column(Float)
    time = Column(TIMESTAMP)

    storm = relationship("Storm", back_populates="damage_assessment")
    news = relationship("NewsSource", back_populates="assessment")
