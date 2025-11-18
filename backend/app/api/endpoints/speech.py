from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Dict
from app.services.speech_analyzer import SpeechAnalyzer
from app.schemas.speech import SpeechAnalysisResult

router = APIRouter()
speech_analyzer = SpeechAnalyzer()


@router.get("/categories")
async def get_categories() -> Dict:
    """
    Get all available speech categories with their ideal PPM ranges
    """
    return {"categories": speech_analyzer.get_categories()}


@router.post("/analyze", response_model=SpeechAnalysisResult)
async def analyze_speech(
    audio_file: UploadFile = File(...),
    category: str = Form(...)
) -> Dict:
    """
    Analyze speech from an audio file
    
    Args:
        audio_file: Audio file (mp3, wav, m4a, etc.)
        category: Speech category (presentation, pitch, conversation, other)
    
    Returns:
        SpeechAnalysisResult with analysis metrics and feedback
    """
    # Validate category
    valid_categories = speech_analyzer.get_categories().keys()
    if category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    # Read audio file
    try:
        audio_data = await audio_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading audio file: {str(e)}")
    
    if len(audio_data) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    
    # Analyze speech
    try:
        result = speech_analyzer.analyze_audio_file(audio_data, category)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")
