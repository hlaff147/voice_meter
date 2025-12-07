from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Request, Depends
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.speech_analyzer import SpeechAnalyzer
from app.services.transcription_service import get_transcription_service
from app.services.speech_analysis_service import get_speech_analysis_service
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
        advanced_analysis = None
        
        # Transcribe audio using Whisper
        try:
            logger.info("🎙️ Starting Whisper transcription...")
            transcription_service = get_transcription_service()
            transcription_result = transcription_service.transcribe_audio(audio_data)
            transcribed_text = transcription_result["text"]
            segments = transcription_result.get("segments", [])
            duration = transcription_result.get("duration", result['duration_seconds'])
            logger.info(f"✅ Transcription complete: {transcribed_text[:100]}...")
            
            # Perform advanced speech analysis based on research paper
            try:
                logger.info("📊 Performing advanced speech analysis...")
                speech_analysis_service = get_speech_analysis_service()
                advanced_analysis_obj = speech_analysis_service.analyze_comprehensive(
                    transcribed_text,
                    duration,
                    segments
                )
                advanced_analysis = speech_analysis_service.to_dict(advanced_analysis_obj)
                logger.info(f"✅ Advanced analysis complete - Overall: {advanced_analysis['overall_score']}")
            except Exception as adv_e:
                logger.error(f"⚠️ Advanced analysis failed: {str(adv_e)}")
            
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
        
        # If we have advanced analysis, use it as primary score
        if advanced_analysis:
            score = advanced_analysis['overall_score'] * 0.5
        
        # If we have pronunciation score, add it (30% of total)
        if pronunciation_score is not None:
            score += pronunciation_score * 0.3
        else:
            # Fallback to original scoring if no transcription
            if result['is_within_range']:
                score += 15
            else:
                deviation = min(
                    abs(result['articulation_rate'] - result['ideal_min_ppm']),
                    abs(result['articulation_rate'] - result['ideal_max_ppm'])
                )
                score += max(0, 15 - (deviation / 4))
        
        # Score for intelligibility (+/- 10 points)
        score += (result['intelligibility_score'] / 100) * 10
        
        # Score for pacing consistency (+/- 10 points)
        score += result['pacing_consistency'] * 10
        
        overall_score = int(max(0, min(100, score)))
        
        # Generate real volume data for visualization using librosa RMS
        num_points = min(int(result['duration_seconds']), 60)
        volume_result = speech_analyzer.calculate_volume_over_time(audio_data, num_points)
        volume_data = volume_result['volume_data']
        volume_min = volume_result['volume_min']
        volume_max = volume_result['volume_max']
        volume_avg = volume_result['volume_avg']
        
        # Generate recommendations
        recommendations = []
        
        # Add advanced analysis recommendations first
        if advanced_analysis and advanced_analysis.get('recommendations'):
            recommendations.extend(advanced_analysis['recommendations'])
        
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
        
        # Add advanced analysis feedback as patterns
        if advanced_analysis and advanced_analysis.get('feedback'):
            patterns.extend(advanced_analysis['feedback'])
        
        if result['local_variation_detected']:
            patterns.append("Variação de ritmo detectada em diferentes partes")
        
        if result['pause_count'] > result['duration_seconds'] / 5:
            patterns.append("Alto número de pausas - possível hesitação")
        
        # Calculate speech efficiency (ratio of active speech to total duration)
        speech_efficiency = result['active_speech_time'] / result['duration_seconds'] if result['duration_seconds'] > 0 else 0
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
                # Advanced analysis metrics - Language
                detected_language=advanced_analysis['language']['detected_language'] if advanced_analysis else None,
                language_confidence=advanced_analysis['language']['confidence'] if advanced_analysis else None,
                # Speech Rate
                speaking_rate_spm=advanced_analysis['speech_rate']['speaking_rate_spm'] if advanced_analysis else None,
                articulation_rate_spm=advanced_analysis['speech_rate']['articulation_rate_spm'] if advanced_analysis else None,
                speech_duration_seconds=advanced_analysis['speech_rate']['speech_duration_seconds'] if advanced_analysis else None,
                pause_duration_total=advanced_analysis['speech_rate']['pause_duration_seconds'] if advanced_analysis else None,
                speech_rate_classification=advanced_analysis['speech_rate']['classification'] if advanced_analysis else None,
                # Pause metrics
                total_pauses=advanced_analysis['pauses']['total_pauses'] if advanced_analysis else None,
                total_pause_duration=advanced_analysis['pauses']['total_pause_duration'] if advanced_analysis else None,
                average_pause_duration=advanced_analysis['pauses']['average_pause_duration'] if advanced_analysis else None,
                longest_pause=advanced_analysis['pauses']['longest_pause'] if advanced_analysis else None,
                pauses_per_minute=advanced_analysis['pauses']['pauses_per_minute'] if advanced_analysis else None,
                pause_ratio=advanced_analysis['pauses']['pause_ratio'] if advanced_analysis else None,
                # Vocabulary metrics
                total_words=advanced_analysis['vocabulary']['total_words'] if advanced_analysis else None,
                unique_words=advanced_analysis['vocabulary']['unique_words'] if advanced_analysis else None,
                vocabulary_richness=advanced_analysis['vocabulary']['vocabulary_richness'] if advanced_analysis else None,
                average_word_length=advanced_analysis['vocabulary']['average_word_length'] if advanced_analysis else None,
                complex_words_count=advanced_analysis['vocabulary']['complex_words_count'] if advanced_analysis else None,
                complex_words_ratio=advanced_analysis['vocabulary']['complex_words_ratio'] if advanced_analysis else None,
                filler_words_count=advanced_analysis['vocabulary']['filler_words_count'] if advanced_analysis else None,
                filler_words_ratio=advanced_analysis['vocabulary']['filler_words_ratio'] if advanced_analysis else None,
                lexical_density=advanced_analysis['vocabulary']['lexical_density'] if advanced_analysis else None,
                # Fluency metrics
                fluency_score=advanced_analysis['fluency']['fluency_score'] if advanced_analysis else None,
                hesitation_rate=advanced_analysis['fluency']['hesitation_rate'] if advanced_analysis else None,
                repetition_count=advanced_analysis['fluency']['repetition_count'] if advanced_analysis else None,
                self_corrections_count=advanced_analysis['fluency']['self_corrections_count'] if advanced_analysis else None,
                incomplete_sentences=advanced_analysis['fluency']['incomplete_sentences'] if advanced_analysis else None,
                # Full advanced analysis JSON
                advanced_analysis_json=json.dumps(advanced_analysis) if advanced_analysis else None,
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
        
        # Add advanced analysis results
        result['advanced_analysis'] = advanced_analysis
        
        return result
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error analyzing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")
