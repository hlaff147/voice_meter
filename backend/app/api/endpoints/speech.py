from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Request
from typing import Dict
from app.services.speech_analyzer import SpeechAnalyzer
from app.schemas.speech import SpeechAnalysisResult
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
speech_analyzer = SpeechAnalyzer()


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
    category: str = Form(..., description="Speech category")
) -> Dict:
    """
    Analyze speech from an audio file
    
    Args:
        audio_file: Audio file (mp3, wav, m4a, etc.)
        category: Speech category (presentation, pitch, conversation, other)
    
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
        return result
    except ValueError as e:
        logger.error(f"❌ Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error analyzing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")
