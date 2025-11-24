from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SpeechCategory(BaseModel):
    """Speech category with ideal speed range"""
    name: str
    min_ppm: int
    max_ppm: int
    description: str


class SpeechAnalysisResult(BaseModel):
    """Result of advanced speech analysis based on research"""
    # Recording identification
    recording_id: Optional[int] = None  # ID of the saved recording
    overall_score: Optional[int] = None  # 0-100 score
    
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
        from_attributes = True


# New schemas for historical data and statistics

class RecordingBase(BaseModel):
    """Base recording information"""
    id: int
    created_at: datetime
    title: Optional[str] = None
    category: str
    duration_seconds: float
    overall_score: int
    words_per_minute: float
    ideal_min_ppm: Optional[int] = None
    ideal_max_ppm: Optional[int] = None
    is_within_range: Optional[bool] = None
    local_variation_detected: Optional[bool] = None
    
    class Config:
        from_attributes = True


class RecordingListItem(RecordingBase):
    """Recording item for list view (screen 8)"""
    pass


class VolumeDataPoint(BaseModel):
    """Volume data point for chart"""
    value: float


class RecordingDetail(RecordingBase):
    """Detailed recording with all metrics (screen 7)"""
    speech_rate: float
    articulation_rate: float
    ideal_min_ppm: int
    ideal_max_ppm: int
    is_within_range: bool
    active_speech_time: float
    silence_ratio: float
    pause_count: int
    avg_pause_duration: float
    pacing_consistency: float
    local_variation_detected: bool
    intelligibility_score: float
    feedback: str
    confidence: float
    volume_min_db: Optional[float] = None
    volume_max_db: Optional[float] = None
    volume_avg_db: Optional[float] = None
    volume_data: Optional[List[float]] = None
    recommendations: Optional[List[str]] = None
    patterns_identified: Optional[List[str]] = None
    notes: Optional[str] = None


class UserStats(BaseModel):
    """User statistics (screen 9)"""
    total_recordings: int
    total_duration_seconds: float
    average_score: float
    member_since: datetime
    score_trend: float
    recordings_this_week: int
    recordings_this_month: int
    best_score: int
    best_score_date: Optional[datetime] = None
    evolution_data: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True


class RecordingFilter(BaseModel):
    """Filter options for recordings list"""
    period: Optional[str] = "all"  # all, week, month
    category: Optional[str] = None
    limit: Optional[int] = 50
