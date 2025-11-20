from pydantic import BaseModel
from typing import Optional


class SpeechCategory(BaseModel):
    """Speech category with ideal speed range"""
    name: str
    min_ppm: int
    max_ppm: int
    description: str


class SpeechAnalysisResult(BaseModel):
    """Result of advanced speech analysis based on research"""
    category: str
    
    # Primary metrics (Articulation Rate)
    words_per_minute: float  # AR - primary metric
    speech_rate: float  # SR - includes pauses
    articulation_rate: float  # AR - excludes pauses
    ideal_min_ppm: int
    ideal_max_ppm: int
    duration_seconds: float
    is_within_range: bool
    
    # Advanced metrics
    active_speech_time: float
    silence_ratio: float
    pause_count: int
    avg_pause_duration: float
    pacing_consistency: float
    local_variation_detected: bool
    intelligibility_score: float
    
    # Feedback and confidence
    feedback: str
    confidence: float


class SpeechAnalysisRequest(BaseModel):
    """Request for speech analysis"""
    category: str  # "presentation", "pitch", "conversation", "other"


class SpeechHistoryItem(SpeechAnalysisResult):
    """History item with ID and timestamp"""
    id: int
    created_at: str

    class Config:
        orm_mode = True
