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
        Analyze audio file and calculate advanced speech metrics
        
        Based on scientific research on optimal speech rate:
        - Differentiates Speech Rate (SR) from Articulation Rate (AR)
        - Analyzes pause patterns and silence ratio
        - Detects local pacing variations
        - Estimates intelligibility based on rate consistency
        
        Args:
            audio_data: Audio file bytes
            category: Speech category (presentation, pitch, conversation, other)
            
        Returns:
            Dict with comprehensive analysis results including:
            - Speech Rate (SR): Overall WPM including pauses
            - Articulation Rate (AR): WPM during active speech only
            - Pause analysis and silence ratio
            - Local pacing variations
            - Intelligibility score
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
        
        # Advanced Speech Analysis (based on research paper)
        logger.info(f"📊 Audio duration: {duration:.2f}s, Sample rate: {sr}Hz")
        
        # 1. Detect speech vs silence regions
        speech_analysis = self._analyze_speech_activity(y, sr)
        logger.info(f"🎯 Speech activity: {speech_analysis['speech_ratio']*100:.1f}% ({speech_analysis['active_speech_duration']:.2f}s active)")
        
        # 2. Calculate Speech Rate (SR) - includes pauses
        sr_wpm = self._estimate_words_per_minute(y, sr, duration)
        logger.info(f"📈 Speech Rate (SR): {sr_wpm:.1f} PPM")
        
        # 3. Calculate Articulation Rate (AR) - excludes pauses
        ar_wpm = self._calculate_articulation_rate(y, sr, speech_analysis)
        logger.info(f"🎤 Articulation Rate (AR): {ar_wpm:.1f} PPM")
        
        # 4. Analyze pause patterns
        pause_analysis = self._analyze_pauses(speech_analysis, duration)
        
        # 5. Detect local pacing variations
        pacing_variations = self._analyze_local_pacing(y, sr, speech_analysis)
        
        # 6. Estimate intelligibility
        intelligibility = self._estimate_intelligibility(ar_wpm, pacing_variations, pause_analysis)
        
        # Get category info
        cat_info = self.CATEGORIES.get(category, self.CATEGORIES["other"])
        
        # Use Articulation Rate (AR) for comparison with ideal range
        # AR is more accurate as it excludes pauses
        is_within_range = cat_info["min_ppm"] <= ar_wpm <= cat_info["max_ppm"]
        
        # Generate comprehensive feedback
        feedback = self._generate_advanced_feedback(
            sr_wpm, ar_wpm, cat_info, is_within_range, 
            pause_analysis, pacing_variations, intelligibility
        )
        
        return {
            "category": cat_info["name"],
            # Primary metrics
            "words_per_minute": round(ar_wpm, 1),  # AR is primary metric
            "speech_rate": round(sr_wpm, 1),  # SR for reference
            "articulation_rate": round(ar_wpm, 1),
            "ideal_min_ppm": cat_info["min_ppm"],
            "ideal_max_ppm": cat_info["max_ppm"],
            "duration_seconds": round(duration, 2),
            "is_within_range": is_within_range,
            
            # Advanced metrics
            "active_speech_time": round(speech_analysis['active_speech_duration'], 2),
            "silence_ratio": round(pause_analysis['silence_ratio'] * 100, 1),
            "pause_count": pause_analysis['total_pauses'],
            "avg_pause_duration": round(pause_analysis['avg_pause_duration'], 2),
            "pacing_consistency": round(pacing_variations['consistency_score'], 1),
            "local_variation_detected": pacing_variations['has_significant_variation'],
            "intelligibility_score": round(intelligibility, 1),
            
            # Feedback
            "feedback": feedback,
            "confidence": round(speech_analysis['speech_ratio'] * 100, 2)
        }
    
    def _estimate_words_per_minute(self, y: np.ndarray, sr: int, duration: float) -> float:
        """
        Estimate words per minute based on syllable detection
        
        This uses onset detection as a proxy for syllable counting.
        Average syllables per word in Portuguese ≈ 2.5-3.0
        """
        # Detect onsets (sudden increases in energy - approximates syllables)
        # Using more sensitive parameters for better detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, aggregate=np.median)
        onsets = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=sr,
            backtrack=True,
            units='time',
            pre_max=3,
            post_max=3,
            pre_avg=3,
            post_avg=3,
            delta=0.1,  # More sensitive threshold
            wait=0.05   # Minimum time between onsets (50ms)
        )
        
        # Count syllables (onsets)
        num_syllables = len(onsets)
        onset_density = num_syllables / duration if duration > 0 else 0
        logger.info(f"🔢 Detected {num_syllables} onsets (syllables) in {duration:.2f}s ({onset_density:.2f} onsets/sec)")
        
        # Estimate words (Portuguese average: ~2.7 syllables per word)
        syllables_per_word = 2.7
        num_words = num_syllables / syllables_per_word
        logger.info(f"📝 Estimated {num_words:.1f} words ({syllables_per_word} syllables/word)")
        
        # Calculate words per minute
        duration_minutes = duration / 60.0
        wpm = num_words / duration_minutes if duration_minutes > 0 else 0
        logger.info(f"⏱️ Raw WPM calculation: {wpm:.1f}")
        
        # Sanity check: human speech is typically 80-200 WPM
        # If outside this range, apply correction
        original_wpm = wpm
        if wpm < 50:
            wpm = max(80, wpm * 2.0)  # Likely missed syllables, apply stronger correction
            logger.warning(f"⚠️ WPM too low ({original_wpm:.1f}), correcting to {wpm:.1f}")
        elif wpm > 250:
            wpm = min(200, wpm * 0.8)  # Might have false detections
            logger.warning(f"⚠️ WPM too high ({original_wpm:.1f}), correcting to {wpm:.1f}")
        
        return wpm
    
    def _analyze_speech_activity(self, y: np.ndarray, sr: int) -> Dict:
        """
        Detect speech vs silence regions using Voice Activity Detection (VAD)
        Returns timing info for active speech segments
        """
        # Calculate RMS energy for VAD
        frame_length = 2048
        hop_length = 512
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
        
        # Adaptive threshold using percentile (more robust for fast speech)
        # Use 10th percentile + margin instead of fixed % of max
        # This handles both loud and soft speech better
        percentile_10 = np.percentile(rms, 10)
        percentile_90 = np.percentile(rms, 90)
        threshold = percentile_10 + (percentile_90 - percentile_10) * 0.25
        logger.debug(f"🔊 RMS threshold: {threshold:.6f} (p10: {percentile_10:.6f}, p90: {percentile_90:.6f})")
        
        # Create binary mask: 1 for speech, 0 for silence
        speech_frames = rms > threshold
        
        # Convert frames to time
        frames_to_time = lambda f: librosa.frames_to_time(f, sr=sr, hop_length=hop_length)
        
        # Calculate active speech duration
        active_frames = np.sum(speech_frames)
        total_frames = len(speech_frames)
        speech_ratio = active_frames / total_frames if total_frames > 0 else 0
        active_speech_duration = speech_ratio * librosa.get_duration(y=y, sr=sr)
        
        return {
            'speech_frames': speech_frames,
            'speech_ratio': speech_ratio,
            'active_speech_duration': active_speech_duration,
            'frame_times': frames_to_time(np.arange(len(speech_frames)))
        }
    
    def _calculate_articulation_rate(self, y: np.ndarray, sr: int, speech_analysis: Dict) -> float:
        """
        Calculate Articulation Rate (AR) - WPM during active speech only
        Uses hybrid approach: filtered by VAD when reliable, direct calculation otherwise
        """
        active_duration = speech_analysis['active_speech_duration']
        total_duration = librosa.get_duration(y=y, sr=sr)
        speech_ratio = speech_analysis['speech_ratio']
        logger.info(f"⏰ Active speech duration: {active_duration:.2f}s ({speech_ratio*100:.1f}% of total)")
        
        if active_duration < 0.5:
            logger.warning("⚠️ Active duration too short (<0.5s)")
            return 0.0
        
        # Detect onsets with improved sensitivity
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, aggregate=np.median)
        onsets = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=sr,
            backtrack=True,
            units='time',
            pre_max=3,
            post_max=3,
            pre_avg=3,
            post_avg=3,
            delta=0.1,
            wait=0.05
        )
        
        total_onsets = len(onsets)
        logger.info(f"🔍 Total onsets detected: {total_onsets}")
        
        # Filter onsets to only include those during active speech
        speech_frames = speech_analysis['speech_frames']
        frame_times = speech_analysis['frame_times']
        
        active_onsets = []
        for onset_time in onsets:
            # Find closest frame
            frame_idx = np.argmin(np.abs(frame_times - onset_time))
            if frame_idx < len(speech_frames) and speech_frames[frame_idx]:
                active_onsets.append(onset_time)
        
        num_active_onsets = len(active_onsets)
        logger.info(f"✅ Active onsets (during speech): {num_active_onsets}")
        
        # Calculate retention rate to detect if VAD is too aggressive
        retention_rate = num_active_onsets / total_onsets if total_onsets > 0 else 1.0
        
        # HYBRID APPROACH: If VAD filtered out too many onsets, use direct calculation
        # This happens with fast/percussive speech where VAD is too conservative
        if speech_ratio < 0.4 and retention_rate < 0.5:
            logger.warning(f"⚠️ VAD too restrictive ({speech_ratio*100:.1f}% activity, {retention_rate*100:.1f}% onsets kept)")
            logger.info("💡 Using DIRECT method: calculating AR from all onsets with active duration")
            
            # Use all onsets but with active duration for more realistic rate
            num_syllables = total_onsets
            calculation_duration = active_duration
        else:
            # Standard VAD-filtered approach
            logger.info(f"✓ Using VAD-FILTERED method ({retention_rate*100:.1f}% onsets retained)")
            num_syllables = num_active_onsets
            calculation_duration = active_duration
        
        # Dynamic syllables per word based on onset density
        # Fast speech with many short pauses = likely monosyllabic/short words
        # Slow speech with few pauses = likely longer words
        onset_density = num_syllables / calculation_duration  # syllables per second
        
        if onset_density > 4.0:
            # Very fast: likely short words (1.5-2.0 syllables/word)
            syllables_per_word = 1.8
            logger.info(f"🏃 Fast speech detected ({onset_density:.1f} syl/s) → using {syllables_per_word} syl/word")
        elif onset_density > 3.0:
            # Fast: mixed short words (2.0-2.5 syllables/word)
            syllables_per_word = 2.2
            logger.info(f"⚡ Above-average speed ({onset_density:.1f} syl/s) → using {syllables_per_word} syl/word")
        elif onset_density < 1.5:
            # Very slow: likely longer words (3.0+ syllables/word)
            syllables_per_word = 3.0
            logger.info(f"🐢 Slow speech detected ({onset_density:.1f} syl/s) → using {syllables_per_word} syl/word")
        else:
            # Normal: Portuguese average
            syllables_per_word = 2.7
            logger.info(f"📊 Normal speed ({onset_density:.1f} syl/s) → using {syllables_per_word} syl/word")
        
        num_words = num_syllables / syllables_per_word
        logger.info(f"📚 Words estimated: {num_words:.1f} from {num_syllables} syllables")
        
        # AR = words / calculation duration (in minutes)
        duration_minutes = calculation_duration / 60.0
        ar_wpm = num_words / duration_minutes if duration_minutes > 0 else 0
        logger.info(f"🎯 Raw AR: {ar_wpm:.1f} PPM")
        
        # Intelligent correction based on total onset density
        original_ar = ar_wpm
        total_onset_density = total_onsets / total_duration  # onsets per second
        
        if ar_wpm < 50:
            # Very low AR - likely missed syllables or wrong syllables/word ratio
            if total_onset_density < 2.0:  # Less than 2 syllables/sec is very slow
                ar_wpm = max(80, ar_wpm * 2.5)  # Strong correction
                logger.warning(f"⚠️ AR very low ({original_ar:.1f}), correcting to {ar_wpm:.1f}")
            else:
                ar_wpm = max(80, ar_wpm * 1.8)  # Moderate correction
                logger.warning(f"⚠️ AR low ({original_ar:.1f}), correcting to {ar_wpm:.1f}")
        elif ar_wpm > 250:
            ar_wpm = min(220, ar_wpm * 0.85)  # Allow higher ceiling for very fast speech
            logger.warning(f"⚠️ AR too high ({original_ar:.1f}), correcting to {ar_wpm:.1f}")
        
        return ar_wpm
    
    def _analyze_pauses(self, speech_analysis: Dict, total_duration: float) -> Dict:
        """
        Analyze pause patterns and calculate silence ratio
        Strategic pauses are crucial for effective communication
        """
        speech_frames = speech_analysis['speech_frames']
        frame_times = speech_analysis['frame_times']
        
        # Find silence segments
        silence_segments = []
        in_silence = False
        silence_start = 0
        
        for i, is_speech in enumerate(speech_frames):
            if not is_speech and not in_silence:
                # Start of silence
                in_silence = True
                silence_start = frame_times[i]
            elif is_speech and in_silence:
                # End of silence
                in_silence = False
                silence_end = frame_times[i]
                duration = silence_end - silence_start
                if duration > 0.1:  # Only count pauses longer than 100ms
                    silence_segments.append({
                        'start': silence_start,
                        'end': silence_end,
                        'duration': duration
                    })
        
        total_pauses = len(silence_segments)
        avg_pause_duration = np.mean([s['duration'] for s in silence_segments]) if silence_segments else 0
        silence_ratio = 1 - speech_analysis['speech_ratio']
        
        # Categorize pauses
        short_pauses = len([s for s in silence_segments if s['duration'] < 0.5])  # < 500ms
        medium_pauses = len([s for s in silence_segments if 0.5 <= s['duration'] < 1.0])
        long_pauses = len([s for s in silence_segments if s['duration'] >= 1.0])
        
        return {
            'total_pauses': total_pauses,
            'avg_pause_duration': avg_pause_duration,
            'silence_ratio': silence_ratio,
            'short_pauses': short_pauses,
            'medium_pauses': medium_pauses,
            'long_pauses': long_pauses,
            'pause_segments': silence_segments
        }
    
    def _analyze_local_pacing(self, y: np.ndarray, sr: int, speech_analysis: Dict) -> Dict:
        """
        Analyze local pacing variations (10-20 syllable segments)
        Detect if speaker has erratic rhythm or maintains consistency
        """
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onsets = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=sr,
            backtrack=True,
            units='time'
        )
        
        if len(onsets) < 20:
            return {
                'consistency_score': 100.0,
                'has_significant_variation': False,
                'local_rates': [],
                'variation_coefficient': 0.0
            }
        
        # Analyze in windows of 15 syllables (approximately 5-6 words)
        window_size = 15
        local_rates = []
        
        for i in range(0, len(onsets) - window_size, window_size // 2):
            window_onsets = onsets[i:i + window_size]
            if len(window_onsets) < 2:
                continue
            
            window_duration = window_onsets[-1] - window_onsets[0]
            if window_duration > 0:
                # Calculate local AR for this window
                syllables_in_window = len(window_onsets)
                words_in_window = syllables_in_window / 2.7
                local_ar = (words_in_window / window_duration) * 60  # Convert to WPM
                local_rates.append(local_ar)
        
        if not local_rates:
            return {
                'consistency_score': 100.0,
                'has_significant_variation': False,
                'local_rates': [],
                'variation_coefficient': 0.0
            }
        
        # Calculate variation
        mean_rate = np.mean(local_rates)
        std_rate = np.std(local_rates)
        variation_coefficient = (std_rate / mean_rate * 100) if mean_rate > 0 else 0
        
        # Consistency score (100 = perfect, 0 = highly variable)
        # Acceptable variation is 15-20% per the paper
        consistency_score = max(0, 100 - (variation_coefficient * 3))
        
        # Flag significant variation (>20%)
        has_significant_variation = variation_coefficient > 20
        
        return {
            'consistency_score': consistency_score,
            'has_significant_variation': has_significant_variation,
            'local_rates': local_rates,
            'variation_coefficient': variation_coefficient,
            'mean_local_rate': mean_rate,
            'std_local_rate': std_rate
        }
    
    def _estimate_intelligibility(self, ar_wpm: float, pacing_variations: Dict, pause_analysis: Dict) -> float:
        """
        Estimate intelligibility based on AR, pacing consistency, and pause usage
        Correlates with WER (Word Error Rate) - higher intelligibility = lower WER
        
        Based on paper: Deviations in pacing increase WER
        """
        intelligibility = 100.0
        
        # Factor 1: Articulation Rate (AR)
        # Absolute intelligibility remains above 400 WPM
        # Optimal is 140-160 for comprehension
        if ar_wpm > 400:
            intelligibility *= 0.3  # Very low intelligibility
        elif ar_wpm > 250:
            intelligibility *= 0.6  # Reduced intelligibility
        elif ar_wpm > 200:
            intelligibility *= 0.85
        elif ar_wpm < 80:
            intelligibility *= 0.9  # Slightly reduced due to unnatural slowness
        
        # Factor 2: Pacing Consistency
        # High variation = higher WER = lower intelligibility
        consistency_penalty = (100 - pacing_variations['consistency_score']) / 100
        intelligibility *= (1 - consistency_penalty * 0.3)
        
        # Factor 3: Pause Patterns
        # Too few pauses = monótono, cognitive buffer eliminated
        # Too many pauses = hesitant, broken flow
        silence_ratio = pause_analysis['silence_ratio']
        if silence_ratio < 0.10:  # Less than 10% silence
            intelligibility *= 0.85  # Penalty for no cognitive buffer
        elif silence_ratio > 0.40:  # More than 40% silence
            intelligibility *= 0.90  # Slight penalty for excessive hesitation
        
        return max(0, min(100, intelligibility))
    
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
    
    def _generate_advanced_feedback(
        self, 
        sr_wpm: float, 
        ar_wpm: float, 
        category_info: Dict, 
        is_within_range: bool,
        pause_analysis: Dict,
        pacing_variations: Dict,
        intelligibility: float
    ) -> str:
        """
        Generate comprehensive feedback based on advanced metrics
        Incorporates AR, pause patterns, and pacing consistency
        """
        min_ppm = category_info["min_ppm"]
        max_ppm = category_info["max_ppm"]
        feedback_parts = []
        
        # 1. Primary feedback on Articulation Rate
        if is_within_range:
            feedback_parts.append(f"✅ Excelente! Sua velocidade de articulação ({ar_wpm:.0f} PPM) está ideal para {category_info['name']}.")
        elif ar_wpm < min_ppm:
            diff = min_ppm - ar_wpm
            feedback_parts.append(f"⚠️ Um pouco devagar. Tente acelerar cerca de {diff:.0f} PPM para ficar na faixa ideal de {min_ppm}-{max_ppm} PPM.")
        else:  # ar_wpm > max_ppm
            diff = ar_wpm - max_ppm
            feedback_parts.append(f"⚠️ Um pouco rápido. Tente diminuir cerca de {diff:.0f} PPM para ficar na faixa ideal de {min_ppm}-{max_ppm} PPM.")
        
        # 2. Pause analysis feedback
        silence_ratio = pause_analysis['silence_ratio']
        if silence_ratio < 0.10:
            feedback_parts.append("💡 Dica: Faça mais pausas estratégicas. Isso dá tempo para o público processar a informação.")
        elif silence_ratio > 0.40:
            feedback_parts.append("💡 Dica: Tente reduzir as hesitações. Pausas muito longas podem quebrar o fluxo da comunicação.")
        elif pause_analysis['medium_pauses'] + pause_analysis['long_pauses'] > 3:
            feedback_parts.append("👍 Ótimo uso de pausas! Isso ajuda na compreensão.")
        
        # 3. Pacing consistency feedback
        if pacing_variations['has_significant_variation']:
            feedback_parts.append(
                f"⚡ Atenção: Detectamos variação de ritmo significativa ({pacing_variations['variation_coefficient']:.0f}%). "
                "Tente manter um ritmo mais consistente."
            )
        elif pacing_variations['consistency_score'] > 85:
            feedback_parts.append("🎯 Ritmo muito consistente! Isso facilita a compreensão.")
        
        # 4. Intelligibility feedback
        if intelligibility < 70:
            feedback_parts.append(
                f"📢 Inteligibilidade estimada: {intelligibility:.0f}%. "
                "Considere ajustar velocidade e pausas para melhorar a clareza."
            )
        elif intelligibility > 90:
            feedback_parts.append(f"🌟 Excelente clareza de comunicação! (Inteligibilidade: {intelligibility:.0f}%)")
        
        # 5. Differentiate SR vs AR if significantly different
        ar_sr_diff = abs(ar_wpm - sr_wpm)
        if ar_sr_diff > 20:
            feedback_parts.append(
                f"📊 Nota: Sua velocidade geral ({sr_wpm:.0f} PPM com pausas) difere da velocidade de articulação "
                f"({ar_wpm:.0f} PPM sem pausas) em {ar_sr_diff:.0f} PPM."
            )
        
        return " ".join(feedback_parts)
    
    def get_categories(self) -> Dict:
        """Return all available categories"""
        return self.CATEGORIES
