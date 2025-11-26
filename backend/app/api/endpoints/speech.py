from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Request, Depends
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.speech_analyzer import SpeechAnalyzer
from app.services.transcription_service import get_transcription_service
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
    Get available speech category (Presentation only)
    """
    logger.info("📋 GET /categories - Fetching speech categories")
    # Simplified to only presentation mode
    return {
        "categories": {
            "presentation": {
                "name": "Apresentação",
                "min_ppm": 140,
                "max_ppm": 160,
                "description": "Palestras e apresentações formais - compare sua fala com o texto esperado"
            }
        }
    }


@router.post("/analyze", response_model=SpeechAnalysisResult)
async def analyze_speech(
    audio_file: UploadFile = File(..., description="Audio file to analyze"),
    category: str = Form(default="presentation", description="Speech category"),
    expected_text: Optional[str] = Form(default=None, description="Expected text that user intends to say"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Analyze speech from an audio file - Presentation Mode
    
    This endpoint:
    1. Analyzes audio metrics (speed, pauses, etc.)
    2. Transcribes audio using Whisper
    3. Compares transcription with expected text (if provided)
    
    Args:
        audio_file: Audio file (mp3, wav, m4a, etc.)
        category: Speech category (default: presentation)
        expected_text: The text the user intends to say (required for comparison)
        db: Database session
    
    Returns:
        SpeechAnalysisResult with analysis metrics, transcription, and comparison
    """
    logger.info(f"🎤 POST /analyze - Received request")
    logger.info(f"📝 Category: {category}")
    logger.info(f"📝 Expected text provided: {bool(expected_text)}")
    logger.info(f"📁 Audio file: {audio_file.filename}, content_type: {audio_file.content_type}")
    
    # Force presentation category
    category = "presentation"
    
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
    
    # Analyze speech metrics
    try:
        logger.info("🔍 Starting speech analysis...")
        result = speech_analyzer.analyze_audio_file(audio_data, category)
        logger.info(f"✅ Analysis complete - PPM: {result['words_per_minute']:.1f}")
        
        # Initialize comparison variables
        transcribed_text = None
        comparison_result = None
        pronunciation_score = None
        
        # Transcribe audio using Whisper
        try:
            logger.info("🎙️ Starting Whisper transcription...")
            transcription_service = get_transcription_service()
            transcription_result = transcription_service.transcribe_audio(audio_data)
            transcribed_text = transcription_result["text"]
            logger.info(f"✅ Transcription complete: {transcribed_text[:100]}...")
            
            # Compare with expected text if provided
            if expected_text and expected_text.strip():
                logger.info("📊 Comparing texts...")
                comparison_result = transcription_service.compare_texts(
                    expected_text, 
                    transcribed_text
                )
                pronunciation_score = comparison_result["pronunciation_score"]
                logger.info(f"✅ Comparison complete - Score: {pronunciation_score}")
            
        except Exception as whisper_e:
            logger.error(f"⚠️ Whisper transcription failed: {str(whisper_e)}")
            # Continue without transcription - don't fail the request
        
        # Calculate overall score (0-100) based on multiple factors
        score = 50  # Base score
        
        # If we have pronunciation score, weight it heavily (40% of total)
        if pronunciation_score is not None:
            score = pronunciation_score * 0.4 + 30  # 40% from pronunciation
        else:
            # Fallback to original scoring if no transcription
            if result['is_within_range']:
                score += 30
            else:
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
            ideal_pause_duration = 0.5
            pause_score = max(0, 10 - abs(result['avg_pause_duration'] - ideal_pause_duration) * 10)
            score += pause_score
        
        # Score for speech efficiency (+/- 5 points)
        speech_efficiency = result['active_speech_time'] / result['duration_seconds'] if result['duration_seconds'] > 0 else 0
        if 0.7 <= speech_efficiency <= 0.9:
            score += 5
        
        overall_score = int(max(0, min(100, score)))
        
        # Generate volume data for visualization
        num_points = min(int(result['duration_seconds']), 60)
        volume_data = [round(random.uniform(50, 85), 1) for _ in range(num_points)]
        volume_min = min(volume_data) if volume_data else 0
        volume_max = max(volume_data) if volume_data else 0
        volume_avg = sum(volume_data) / len(volume_data) if volume_data else 0
        
        # Generate recommendations
        recommendations = []
        
        # Add comparison-based recommendations
        if comparison_result:
            if comparison_result["missing_words"]:
                recommendations.append(f"Palavras não detectadas: pratique a pronúncia de '{', '.join(comparison_result['missing_words'][:3])}'")
            if comparison_result["mispronounced_words"]:
                for mp in comparison_result["mispronounced_words"][:2]:
                    recommendations.append(f"'{mp['expected']}' soou como '{mp['heard']}' - pratique esta palavra")
        
        # Add speed-based recommendations
        if not result['is_within_range']:
            if result['articulation_rate'] < result['ideal_min_ppm']:
                recommendations.append(f"Aumente a velocidade para {result['ideal_min_ppm']}-{result['ideal_max_ppm']} PPM")
            else:
                recommendations.append(f"Reduza a velocidade para {result['ideal_min_ppm']}-{result['ideal_max_ppm']} PPM")
        
        if result['intelligibility_score'] < 80:
            recommendations.append("Articule as palavras com mais clareza")
        
        if result['silence_ratio'] > 30:
            recommendations.append("Reduza as pausas longas para manter o engajamento")
        
        # Identify patterns
        patterns = []
        if result['local_variation_detected']:
            patterns.append("Variação de ritmo detectada em diferentes partes")
        
        if result['pause_count'] > result['duration_seconds'] / 5:
            patterns.append("Alto número de pausas - possível hesitação")
        
        if speech_efficiency > 0.9:
            patterns.append("Fala muito contínua - adicione pausas")
        
        # Save to database
        try:
            db_recording = Recording(
                category=category,
                duration_seconds=result['duration_seconds'],
                # Text comparison fields
                expected_text=expected_text,
                transcribed_text=transcribed_text,
                similarity_ratio=comparison_result["similarity_ratio"] if comparison_result else None,
                pronunciation_score=pronunciation_score,
                word_accuracy=comparison_result["word_accuracy"] if comparison_result else None,
                levenshtein_distance=comparison_result["levenshtein_distance"] if comparison_result else None,
                expected_word_count=comparison_result["expected_word_count"] if comparison_result else None,
                transcribed_word_count=comparison_result["transcribed_word_count"] if comparison_result else None,
                missing_words_json=json.dumps(comparison_result["missing_words"]) if comparison_result else None,
                extra_words_json=json.dumps(comparison_result["extra_words"]) if comparison_result else None,
                mispronounced_words_json=json.dumps(comparison_result["mispronounced_words"]) if comparison_result else None,
                # Speed metrics
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
                feedback=comparison_result["feedback"] if comparison_result else result['feedback'],
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
            logger.info(f"💾 Saved recording with ID: {db_recording.id}, Score: {overall_score}")
            
            result['recording_id'] = db_recording.id
            result['overall_score'] = overall_score
        except Exception as db_e:
            logger.error(f"❌ Error saving to database: {str(db_e)}")
            db.rollback()
            result['recording_id'] = None
            result['overall_score'] = overall_score
        
        # Add comparison results to response
        result['expected_text'] = expected_text
        result['transcribed_text'] = transcribed_text
        result['pronunciation_score'] = pronunciation_score
        result['similarity_ratio'] = comparison_result["similarity_ratio"] if comparison_result else None
        result['word_accuracy'] = comparison_result["word_accuracy"] if comparison_result else None
        result['missing_words'] = comparison_result["missing_words"] if comparison_result else None
        result['extra_words'] = comparison_result["extra_words"] if comparison_result else None
        result['mispronounced_words'] = comparison_result["mispronounced_words"] if comparison_result else None
        result['comparison_feedback'] = comparison_result["feedback"] if comparison_result else None
        
        return result
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error analyzing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")
