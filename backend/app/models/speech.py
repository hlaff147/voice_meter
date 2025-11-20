from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class SpeechHistory(Base):
    __tablename__ = "speech_history"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Primary metrics
    words_per_minute = Column(Float)
    speech_rate = Column(Float)
    articulation_rate = Column(Float)
    duration_seconds = Column(Float)
    is_within_range = Column(Boolean)
    
    # Advanced metrics
    active_speech_time = Column(Float)
    silence_ratio = Column(Float)
    pause_count = Column(Integer)
    avg_pause_duration = Column(Float)
    pacing_consistency = Column(Float)
    intelligibility_score = Column(Float)
    
    # Feedback
    feedback = Column(String)
    confidence = Column(Float)
