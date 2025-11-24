from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Request, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from app.services.speech_analyzer import SpeechAnalyzer
from app.schemas.speech import SpeechAnalysisResult, SpeechHistoryItem
from app.db.base import get_db
from app.models.speech import SpeechHistory
from app.models.recording import Recording
import logging
import json
import random

logger = logging.getLogger(__name__)

router = APIRouter()
speech_analyzer = SpeechAnalyzer()


@router.get("/history", response_model=List[SpeechHistoryItem])
async def get_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get speech analysis history"""
    logger.info("📜 GET /history - Fetching history")
    history = db.query(SpeechHistory).order_by(SpeechHistory.created_at.desc()).offset(skip).limit(limit).all()
    
    # Convert datetime to string for response
    result = []
    for item in history:
        item_dict = item.__dict__
        if item.created_at:
            item_dict['created_at'] = item.created_at.isoformat()
        result.append(item_dict)
        
    return result


@router.post("/debug-upload")
async def debug_upload(request: Request):
    """Debug endpoint to see what's being received"""
    logger.info("🔍 DEBUG: Checking request")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Content-Type: {request.headers.get('content-type')}")
    
    try:
        form = await request.form()
        logger.info(f"Form data keys: {list(form.keys())}")
        for key in form.keys():
            value = form[key]
            if hasattr(value, 'filename'):
                logger.info(f"  {key}: File({value.filename}, {value.content_type})")
            else:
                logger.info(f"  {key}: {value}")
        return {"status": "ok", "received": list(form.keys())}
    except Exception as e:
        logger.error(f"Error parsing form: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/categories")
async def get_categories() -> Dict:
    """
    Get all available speech categories with their ideal PPM ranges
    """
    logger.info("📋 GET /categories - Fetching speech categories")
    categories = speech_analyzer.get_categories()
    logger.info(f"✅ Returning {len(categories)} categories")
    return {"categories": categories}


@router.post("/analyze", response_model=SpeechAnalysisResult)
async def analyze_speech(
    audio_file: UploadFile = File(..., description="Audio file to analyze"),
    category: str = Form(..., description="Speech category"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Analyze speech from an audio file
    
    Args:
        audio_file: Audio file (mp3, wav, m4a, etc.)
        category: Speech category (presentation, pitch, conversation, other)
        db: Database session
    
    Returns:
        SpeechAnalysisResult with analysis metrics and feedback
    """
    logger.info(f"🎤 POST /analyze - Received request")
    logger.info(f"📝 Category parameter: {category if category else 'MISSING'}")
    logger.info(f"📁 Audio file parameter: {audio_file.filename if audio_file else 'MISSING'}")
    logger.info(f"📁 Audio file: {audio_file.filename}, content_type: {audio_file.content_type}")
    
    # Validate category
    valid_categories = speech_analyzer.get_categories().keys()
    if category not in valid_categories:
        logger.error(f"❌ Invalid category: {category}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    # Read audio file
    try:
        audio_data = await audio_file.read()
        logger.info(f"📦 Audio data size: {len(audio_data)} bytes")
    except Exception as e:
        logger.error(f"❌ Error reading audio file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error reading audio file: {str(e)}")
    
    if len(audio_data) == 0:
        logger.error("❌ Audio file is empty")
        raise HTTPException(status_code=400, detail="Audio file is empty")
    
    # Analyze speech
    try:
        logger.info("🔍 Starting speech analysis...")
        result = speech_analyzer.analyze_audio_file(audio_data, category)
        logger.info(f"✅ Analysis complete - PPM: {result['words_per_minute']:.1f}")
        
        # Calculate overall score (0-100) based on multiple factors
        score = 50  # Base score
        
        # Score for being in ideal range (+/- 30 points)
        if result['is_within_range']:
            score += 30
        else:
            # Partial credit based on how close
            deviation = min(
                abs(result['articulation_rate'] - result['ideal_min_ppm']),
                abs(result['articulation_rate'] - result['ideal_max_ppm'])
            )
            score += max(0, 30 - (deviation / 2))
        
        # Score for intelligibility (+/- 20 points)
        score += (result['intelligibility_score'] / 100) * 20
        
        # Score for pacing consistency (+/- 15 points)
        score += result['pacing_consistency'] * 15
        
        # Score for pause management (+/- 10 points)
        if result['pause_count'] > 0:
            ideal_pause_duration = 0.5  # 500ms is ideal
            pause_score = max(0, 10 - abs(result['avg_pause_duration'] - ideal_pause_duration) * 10)
            score += pause_score
        
        # Score for speech efficiency (+/- 5 points)
        speech_efficiency = result['active_speech_time'] / result['duration_seconds'] if result['duration_seconds'] > 0 else 0
        if 0.7 <= speech_efficiency <= 0.9:  # 70-90% is ideal
            score += 5
        
        overall_score = int(max(0, min(100, score)))
        
        # Generate mock volume data for visualization
        num_points = min(int(result['duration_seconds']), 60)  # Max 60 points
        volume_data = [round(random.uniform(50, 85), 1) for _ in range(num_points)]
        volume_min = min(volume_data)
        volume_max = max(volume_data)
        volume_avg = sum(volume_data) / len(volume_data)
        
        # Generate recommendations based on analysis
        recommendations = []
        if not result['is_within_range']:
            if result['articulation_rate'] < result['ideal_min_ppm']:
                recommendations.append(f"Tente aumentar sua velocidade de fala para {result['ideal_min_ppm']}-{result['ideal_max_ppm']} PPM")
            else:
                recommendations.append(f"Tente reduzir sua velocidade de fala para {result['ideal_min_ppm']}-{result['ideal_max_ppm']} PPM")
        
        if result['intelligibility_score'] < 80:
            recommendations.append("Articule as palavras com mais clareza para melhorar a inteligibilidade")
        
        if result['pacing_consistency'] < 0.7:
            recommendations.append("Mantenha um ritmo mais consistente durante a fala")
        
        if result['silence_ratio'] > 30:
            recommendations.append("Reduza as pausas longas para manter o engajamento do público")
        elif result['silence_ratio'] < 10:
            recommendations.append("Adicione pausas estratégicas para dar tempo ao público de processar informações")
        
        # Identify patterns
        patterns = []
        if result['local_variation_detected']:
            patterns.append("Variação local detectada - o ritmo muda em diferentes partes da fala")
        
        if result['pause_count'] > result['duration_seconds'] / 5:
            patterns.append("Alto número de pausas - pode indicar hesitação ou reflexão")
        
        if speech_efficiency > 0.9:
            patterns.append("Fala muito contínua - poucas pausas para respirar")
        
        # Save to new Recording table
        try:
            db_recording = Recording(
                category=category,
                duration_seconds=result['duration_seconds'],
                words_per_minute=result['words_per_minute'],
                speech_rate=result['speech_rate'],
                articulation_rate=result['articulation_rate'],
                ideal_min_ppm=result['ideal_min_ppm'],
                ideal_max_ppm=result['ideal_max_ppm'],
                is_within_range=result['is_within_range'],
                active_speech_time=result['active_speech_time'],
                silence_ratio=result['silence_ratio'],
                pause_count=result['pause_count'],
                avg_pause_duration=result['avg_pause_duration'],
                pacing_consistency=result['pacing_consistency'],
                local_variation_detected=result['local_variation_detected'],
                intelligibility_score=result['intelligibility_score'],
                overall_score=overall_score,
                feedback=result['feedback'],
                confidence=result['confidence'],
                volume_min_db=volume_min,
                volume_max_db=volume_max,
                volume_avg_db=volume_avg,
                volume_data_json=json.dumps(volume_data),
                recommendations=json.dumps(recommendations) if recommendations else None,
                patterns_identified=json.dumps(patterns) if patterns else None,
            )
            db.add(db_recording)
            db.commit()
            db.refresh(db_recording)
            logger.info(f"💾 Saved recording to database with ID: {db_recording.id}, Score: {overall_score}")
        except Exception as db_e:
            logger.error(f"❌ Error saving to database: {str(db_e)}")
            db.rollback()
            # Don't fail the request if saving fails, just log it
        
        return result
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error analyzing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")
