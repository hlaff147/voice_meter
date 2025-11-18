from pydantic import BaseModel
from typing import Optional


class SpeechCategory(BaseModel):
    """Speech category with ideal speed range"""
    name: str
    min_ppm: int
    max_ppm: int
    description: str


class SpeechAnalysisResult(BaseModel):
    """Result of speech analysis"""
    category: str
    words_per_minute: float
    ideal_min_ppm: int
    ideal_max_ppm: int
    duration_seconds: float
    is_within_range: bool
    feedback: str
    confidence: float


class SpeechAnalysisRequest(BaseModel):
    """Request for speech analysis"""
    category: str  # "presentation", "pitch", "conversation", "other"
