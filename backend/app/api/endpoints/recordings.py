"""
API endpoints for recordings history and statistics
"""
import json
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.base import get_db
from app.models.recording import Recording, UserStatistics
from app.schemas.speech import (
    RecordingListItem,
    RecordingDetail,
    UserStats
)

router = APIRouter()


@router.get("/recordings", response_model=List[RecordingListItem])
async def get_recordings(
    period: str = Query("all", description="Filter by period: all, week, month"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get list of recordings with optional filters (Screen 8)
    
    - **period**: Filter by time period (all, week, month)
    - **category**: Filter by recording category
    - **limit**: Maximum number of results
    """
    query = db.query(Recording)
    
    # Apply period filter
    if period == "week":
        week_ago = datetime.now() - timedelta(days=7)
        query = query.filter(Recording.created_at >= week_ago)
    elif period == "month":
        month_ago = datetime.now() - timedelta(days=30)
        query = query.filter(Recording.created_at >= month_ago)
    
    # Apply category filter
    if category:
        query = query.filter(Recording.category == category)
    
    # Order by most recent first
    query = query.order_by(desc(Recording.created_at))
    
    # Apply limit
    recordings = query.limit(limit).all()
    
    return recordings


@router.get("/recordings/{recording_id}", response_model=RecordingDetail)
async def get_recording_detail(
    recording_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific recording (Screen 7)
    
    Returns all metrics, charts data, recommendations, and patterns.
    """
    recording = db.query(Recording).filter(Recording.id == recording_id).first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # Parse JSON fields
    result = RecordingDetail.from_orm(recording)
    
    # Parse volume data
    if recording.volume_data_json:
        try:
            result.volume_data = json.loads(recording.volume_data_json)
        except:
            result.volume_data = None
    
    # Parse recommendations
    if recording.recommendations:
        try:
            result.recommendations = json.loads(recording.recommendations)
        except:
            result.recommendations = []
    
    # Parse patterns
    if recording.patterns_identified:
        try:
            result.patterns_identified = json.loads(recording.patterns_identified)
        except:
            result.patterns_identified = []
    
    return result


@router.get("/statistics", response_model=UserStats)
async def get_user_statistics(
    db: Session = Depends(get_db)
):
    """
    Get user statistics and progress data (Screen 9)
    
    Returns overall stats, trends, and evolution data for charts.
    """
    # Get or create user statistics (simplified - single user for now)
    stats = db.query(UserStatistics).first()
    
    if not stats:
        # If no stats exist, calculate from recordings
        recordings = db.query(Recording).all()
        
        if not recordings:
            raise HTTPException(status_code=404, detail="No statistics available")
        
        total_recordings = len(recordings)
        avg_score = sum(r.overall_score for r in recordings) / total_recordings
        total_duration = sum(r.duration_seconds for r in recordings)
        
        # Calculate this week and month
        week_ago = datetime.now() - timedelta(days=7)
        month_ago = datetime.now() - timedelta(days=30)
        
        recordings_this_week = len([r for r in recordings if r.created_at >= week_ago])
        recordings_this_month = len([r for r in recordings if r.created_at >= month_ago])
        
        # Get best score
        best_recording = max(recordings, key=lambda r: r.overall_score)
        
        # Create basic stats object
        stats_dict = {
            "total_recordings": total_recordings,
            "total_duration_seconds": total_duration,
            "average_score": avg_score,
            "member_since": min(r.created_at for r in recordings),
            "score_trend": 0.0,
            "recordings_this_week": recordings_this_week,
            "recordings_this_month": recordings_this_month,
            "best_score": best_recording.overall_score,
            "best_score_date": best_recording.created_at,
            "evolution_data": []
        }
        
        return UserStats(**stats_dict)
    
    # Parse evolution data
    result = UserStats.from_orm(stats)
    
    if stats.evolution_data_json:
        try:
            result.evolution_data = json.loads(stats.evolution_data_json)
        except:
            result.evolution_data = []
    
    return result


@router.delete("/recordings/{recording_id}")
async def delete_recording(
    recording_id: int,
    db: Session = Depends(get_db)
):
    """Delete a recording"""
    recording = db.query(Recording).filter(Recording.id == recording_id).first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    db.delete(recording)
    db.commit()
    
    return {"message": "Recording deleted successfully"}


@router.get("/recordings/stats/summary")
async def get_summary_stats(
    db: Session = Depends(get_db)
):
    """
    Get quick summary statistics for dashboard
    """
    # Get most recent recording
    latest = db.query(Recording).order_by(desc(Recording.created_at)).first()
    
    # Get counts
    total_count = db.query(Recording).count()
    week_ago = datetime.now() - timedelta(days=7)
    week_count = db.query(Recording).filter(Recording.created_at >= week_ago).count()
    
    # Calculate average score
    all_recordings = db.query(Recording).all()
    avg_score = sum(r.overall_score for r in all_recordings) / len(all_recordings) if all_recordings else 0
    
    return {
        "latest_score": latest.overall_score if latest else None,
        "latest_category": latest.category if latest else None,
        "latest_date": latest.created_at if latest else None,
        "total_recordings": total_count,
        "recordings_this_week": week_count,
        "average_score": round(avg_score, 1)
    }
