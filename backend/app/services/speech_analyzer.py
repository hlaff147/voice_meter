import librosa
import numpy as np
import soundfile as sf
from typing import Dict, Tuple
import io
from pydub import AudioSegment
import tempfile
import os
import logging

logger = logging.getLogger(__name__)


class SpeechAnalyzer:
    """Service for analyzing speech audio files"""
    
    # Speech categories with ideal PPM ranges (based on research)
    CATEGORIES = {
        "presentation": {
            "name": "Apresentação",
            "min_ppm": 140,
            "max_ppm": 160,
            "description": "Palestras e apresentações formais"
        },
        "pitch": {
            "name": "Pitch",
            "min_ppm": 120,
            "max_ppm": 150,
            "description": "Vendas e apresentações de negócios"
        },
        "conversation": {
            "name": "Conversação Diária",
            "min_ppm": 100,
            "max_ppm": 130,
            "description": "Conversas informais do dia a dia"
        },
        "other": {
            "name": "Outros",
            "min_ppm": 110,
            "max_ppm": 140,
            "description": "Contextos personalizados"
        }
    }
    
    def __init__(self):
        pass
    
    def analyze_audio_file(self, audio_data: bytes, category: str) -> Dict:
        """
        Analyze audio file and calculate speech metrics
        
        Args:
            audio_data: Audio file bytes
            category: Speech category (presentation, pitch, conversation, other)
            
        Returns:
            Dict with analysis results
        """
        # Load audio data with format conversion support
        try:
            # Try loading directly first
            audio_stream = io.BytesIO(audio_data)
            try:
                y, sr = librosa.load(audio_stream, sr=None)
            except Exception as direct_error:
                # If direct load fails, try converting with pydub
                logger.info(f"🔄 Converting audio format (WebM/other → WAV)...")
                
                # Create temporary file to store audio
                with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_input:
                    temp_input.write(audio_data)
                    temp_input_path = temp_input.name
                
                try:
                    # Convert to WAV using pydub
                    audio = AudioSegment.from_file(temp_input_path)
                    
                    # Export to temporary WAV file
                    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_output:
                        temp_output_path = temp_output.name
                    
                    audio.export(temp_output_path, format='wav')
                    
                    # Load with librosa
                    y, sr = librosa.load(temp_output_path, sr=None)
                    
                    # Clean up temp files
                    os.unlink(temp_output_path)
                finally:
                    os.unlink(temp_input_path)
                    
        except Exception as e:
            raise ValueError(f"Error loading audio file: {str(e)}")
        
        # Calculate duration
        duration = librosa.get_duration(y=y, sr=sr)
        
        if duration < 1.0:
            raise ValueError("Audio too short. Please record at least 1 second of speech.")
        
        # Estimate speech rate (words per minute)
        wpm = self._estimate_words_per_minute(y, sr, duration)
        
        # Get category info
        cat_info = self.CATEGORIES.get(category, self.CATEGORIES["other"])
        
        # Check if within ideal range
        is_within_range = cat_info["min_ppm"] <= wpm <= cat_info["max_ppm"]
        
        # Generate feedback
        feedback = self._generate_feedback(wpm, cat_info, is_within_range)
        
        # Calculate confidence (how much audio contains speech vs silence)
        confidence = self._calculate_confidence(y, sr)
        
        return {
            "category": cat_info["name"],
            "words_per_minute": round(wpm, 1),
            "ideal_min_ppm": cat_info["min_ppm"],
            "ideal_max_ppm": cat_info["max_ppm"],
            "duration_seconds": round(duration, 2),
            "is_within_range": is_within_range,
            "feedback": feedback,
            "confidence": round(confidence, 2)
        }
    
    def _estimate_words_per_minute(self, y: np.ndarray, sr: int, duration: float) -> float:
        """
        Estimate words per minute based on syllable detection
        
        This uses onset detection as a proxy for syllable counting.
        Average syllables per word in Portuguese ≈ 2.5-3.0
        """
        # Detect onsets (sudden increases in energy - approximates syllables)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onsets = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=sr,
            backtrack=True,
            units='time'
        )
        
        # Count syllables (onsets)
        num_syllables = len(onsets)
        
        # Estimate words (Portuguese average: ~2.7 syllables per word)
        syllables_per_word = 2.7
        num_words = num_syllables / syllables_per_word
        
        # Calculate words per minute
        duration_minutes = duration / 60.0
        wpm = num_words / duration_minutes if duration_minutes > 0 else 0
        
        # Sanity check: human speech is typically 80-200 WPM
        # If outside this range, apply correction
        if wpm < 50:
            wpm = max(80, wpm * 1.5)  # Might have missed some syllables
        elif wpm > 250:
            wpm = min(200, wpm * 0.8)  # Might have false detections
        
        return wpm
    
    def _calculate_confidence(self, y: np.ndarray, sr: int) -> float:
        """
        Calculate confidence score based on speech-to-silence ratio
        """
        # Calculate RMS energy
        rms = librosa.feature.rms(y=y)[0]
        
        # Define silence threshold (20% of max energy)
        threshold = np.max(rms) * 0.2
        
        # Calculate percentage of frames with speech
        speech_frames = np.sum(rms > threshold)
        total_frames = len(rms)
        
        confidence = (speech_frames / total_frames) * 100 if total_frames > 0 else 0
        
        return confidence
    
    def _generate_feedback(self, wpm: float, category_info: Dict, is_within_range: bool) -> str:
        """
        Generate personalized feedback based on analysis
        """
        min_ppm = category_info["min_ppm"]
        max_ppm = category_info["max_ppm"]
        
        if is_within_range:
            return f"✅ Excelente! Sua velocidade de {wpm:.0f} PPM está ideal para {category_info['name']}."
        elif wpm < min_ppm:
            diff = min_ppm - wpm
            return f"⚠️ Um pouco devagar. Tente acelerar cerca de {diff:.0f} PPM para ficar na faixa ideal de {min_ppm}-{max_ppm} PPM."
        else:  # wpm > max_ppm
            diff = wpm - max_ppm
            return f"⚠️ Um pouco rápido. Tente diminuir cerca de {diff:.0f} PPM para ficar na faixa ideal de {min_ppm}-{max_ppm} PPM."
    
    def get_categories(self) -> Dict:
        """Return all available categories"""
        return self.CATEGORIES
