"""
Advanced Speech Analysis Service - Refactored Version

Based on research from "User speech rates and preferences for system speech rates"
(Dowding et al., International Journal of Human-Computer Studies, 2024)

This service provides comprehensive speech metrics with clean modular architecture.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher

from app.common.constants import (
    FILLER_WORDS,
    STOPWORDS,
    FEEDBACK_MESSAGES,
    OPTIMAL_WPM_MIN,
    OPTIMAL_WPM_MAX,
    IDEAL_WPM_MIN,
    IDEAL_WPM_MAX,
    PAUSE_THRESHOLD_SHORT,
    PAUSE_THRESHOLD_MEDIUM,
    PAUSE_THRESHOLD_LONG,
)
from app.common.exceptions import AnalysisError
from app.enums.language import LanguageCode
from app.enums.analysis import (
    SpeechRateClassification,
    FeedbackSeverity,
    VocabularyLevel,
    PauseType,
)
from app.dto.analysis import (
    SpeechRateMetrics,
    PauseMetrics,
    VocabularyMetrics,
    FluencyMetrics,
    LanguageDetectionResult,
    AdvancedAnalysisResult,
    FeedbackItem,
)
from app.utils.text import (
    tokenize,
    count_syllables_in_text,
    count_words,
    normalize_text,
)
from app.utils.metrics import (
    calculate_wpm,
    calculate_ttr,
    calculate_wpm_score,
    calculate_pause_score,
    calculate_vocabulary_score,
    calculate_fluency_score,
    calculate_overall_score,
)

logger = logging.getLogger(__name__)


# =============================================================================
# LANGUAGE DETECTION MARKERS
# =============================================================================

PORTUGUESE_MARKERS = {
    'que', 'não', 'uma', 'para', 'com', 'está', 'isso', 'mais',
    'como', 'mas', 'por', 'muito', 'também', 'foi', 'são', 'tem',
    'seu', 'sua', 'ele', 'ela', 'você', 'nós', 'eles', 'nosso',
    'esse', 'essa', 'aqui', 'onde', 'quando', 'porque', 'então',
    'até', 'depois', 'agora', 'sempre', 'ainda', 'apenas', 'sobre',
    'já', 'fazer', 'pode', 'deve', 'vai', 'vou', 'estou', 'tinha',
    'seria', 'podemos', 'temos', 'precisamos', 'conseguimos'
}

ENGLISH_MARKERS = {
    'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you',
    'this', 'but', 'his', 'from', 'they', 'were', 'been', 'have',
    'their', 'would', 'there', 'what', 'about', 'which', 'when',
    'make', 'can', 'will', 'more', 'these', 'want', 'way', 'could',
    'people', 'than', 'first', 'been', 'who', 'its', 'now', 'find',
    'because', 'should', 'think', 'know', 'going', 'need', 'really'
}

# Complex word suffixes by language
COMPLEX_SUFFIXES = {
    'pt-BR': [
        'mente', 'ção', 'ções', 'dade', 'ismo', 'ista',
        'ível', 'ável', 'ência', 'ância', 'mento', 'tivo'
    ],
    'en-US': [
        'tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ful', 'less',
        'ous', 'ive', 'ity', 'ism', 'ist', 'ology', 'ical', 'ally'
    ]
}


class SpeechAnalysisService:
    """
    Advanced speech analysis service with modular design.
    
    Supports:
    - Automatic language detection (PT-BR / EN-US)
    - Speech rate analysis (WPM, syllables/sec)
    - Pause analysis (frequency, duration, patterns)
    - Vocabulary analysis (diversity, complexity, fillers)
    - Fluency analysis (repetitions, corrections, hesitations)
    
    Reference values from research:
    - Optimal speaking rate: 140-180 WPM
    - Ideal speaking rate: 150-165 WPM (preferred by listeners)
    """
    
    # Configuration
    MIN_PAUSE_DURATION = 0.25  # 250ms minimum pause
    LONG_PAUSE_THRESHOLD = 2.0  # Seconds
    COMPLEX_WORD_MIN_LENGTH = 10
    
    def __init__(self):
        """Initialize the speech analysis service."""
        logger.info("✅ Speech Analysis Service initialized (PT-BR & EN-US)")
    
    # =========================================================================
    # LANGUAGE DETECTION
    # =========================================================================
    
    def detect_language(self, text: str) -> LanguageDetectionResult:
        """
        Detect whether the text is in Portuguese or English.
        
        NOTE: Project is 100% focused on pt-BR, so this always returns pt-BR.
        
        Args:
            text: The transcribed text to analyze
            
        Returns:
            LanguageDetectionResult with detected language and confidence
        """
        # Project is 100% focused on pt-BR, always return Portuguese
        logger.info("🌍 Using pt-BR (projeto focado 100% em português)")
        
        return LanguageDetectionResult(
            detected_language=LanguageCode.PORTUGUESE_BR,
            confidence=1.0,
        )
    
    # =========================================================================
    # SPEECH RATE ANALYSIS
    # =========================================================================
    
    def analyze_speech_rate(
        self,
        text: str,
        total_duration: float,
        language: str = 'pt-BR',
        segments: Optional[List[Dict]] = None
    ) -> SpeechRateMetrics:
        """
        Analyze speech rate metrics.
        
        Args:
            text: Transcribed text
            total_duration: Total audio duration in seconds
            language: Language code
            segments: Optional list of segments with timing info
            
        Returns:
            SpeechRateMetrics with detailed rate analysis
        """
        total_words = count_words(text)
        total_syllables = count_syllables_in_text(text, language)
        
        if total_duration <= 0:
            total_duration = 1.0
        
        # Calculate pause duration from segments if available
        pause_duration = self._calculate_pause_duration(segments)
        speech_duration = max(0.1, total_duration - pause_duration)
        
        # Calculate rates
        wpm = calculate_wpm(total_words, total_duration)
        syllables_per_second = total_syllables / speech_duration
        
        # Create metrics
        metrics = SpeechRateMetrics(
            words_per_minute=wpm,
            syllables_per_second=syllables_per_second,
            total_words=total_words,
            total_syllables=total_syllables,
            speaking_duration=speech_duration,
        )
        
        # Calculate score
        metrics.score = calculate_wpm_score(wpm)
        
        return metrics
    
    # =========================================================================
    # PAUSE ANALYSIS
    # =========================================================================
    
    def analyze_pauses(
        self,
        total_duration: float,
        segments: Optional[List[Dict]] = None
    ) -> PauseMetrics:
        """
        Analyze pause patterns in speech.
        
        Args:
            total_duration: Total audio duration
            segments: Optional list of segments with timing info
            
        Returns:
            PauseMetrics with pause analysis
        """
        pauses = self._extract_pauses(segments)
        
        # Categorize pauses
        short_pauses = sum(1 for p in pauses if p < PAUSE_THRESHOLD_SHORT)
        medium_pauses = sum(1 for p in pauses if PAUSE_THRESHOLD_SHORT <= p < PAUSE_THRESHOLD_MEDIUM)
        long_pauses = sum(1 for p in pauses if PAUSE_THRESHOLD_MEDIUM <= p < PAUSE_THRESHOLD_LONG)
        extended_pauses = sum(1 for p in pauses if p >= PAUSE_THRESHOLD_LONG)
        
        total_pauses = len(pauses)
        total_pause_time = sum(pauses)
        
        avg_pause = total_pause_time / total_pauses if total_pauses > 0 else 0.0
        pause_ratio = total_pause_time / total_duration if total_duration > 0 else 0.0
        
        metrics = PauseMetrics(
            total_pauses=total_pauses,
            short_pauses=short_pauses,
            medium_pauses=medium_pauses,
            long_pauses=long_pauses,
            extended_pauses=extended_pauses,
            average_pause_duration=round(avg_pause, 3),
            total_pause_time=round(total_pause_time, 2),
            pause_ratio=round(pause_ratio, 3),
        )
        
        # Calculate score
        metrics.score = calculate_pause_score(total_pauses, total_duration, extended_pauses)
        
        return metrics
    
    # =========================================================================
    # VOCABULARY ANALYSIS
    # =========================================================================
    
    def analyze_vocabulary(
        self,
        text: str,
        language: str = 'pt-BR'
    ) -> VocabularyMetrics:
        """
        Analyze vocabulary complexity and richness.
        
        Args:
            text: The transcribed text
            language: Language code
            
        Returns:
            VocabularyMetrics with vocabulary analysis
        """
        words = self._extract_words(text)
        total_words = len(words)
        
        if total_words == 0:
            return VocabularyMetrics(
                unique_words=0,
                total_content_words=0,
                type_token_ratio=0.0,
                complex_words=0,
                complex_word_ratio=0.0,
            )
        
        # Content words (excluding stopwords)
        content_words = tokenize(text, remove_stopwords=True, language=language)
        unique_words = len(set(words))
        
        # Type-Token Ratio
        ttr = calculate_ttr(words)
        
        # Complex words
        suffixes = COMPLEX_SUFFIXES.get(language, COMPLEX_SUFFIXES['pt-BR'])
        complex_words = [
            w for w in words
            if len(w) >= self.COMPLEX_WORD_MIN_LENGTH
            or any(w.endswith(s) for s in suffixes)
        ]
        complex_count = len(complex_words)
        complex_ratio = complex_count / total_words
        
        # Average word length
        avg_length = sum(len(w) for w in words) / total_words
        
        metrics = VocabularyMetrics(
            unique_words=unique_words,
            total_content_words=len(content_words),
            type_token_ratio=round(ttr, 3),
            complex_words=complex_count,
            complex_word_ratio=round(complex_ratio, 3),
            average_word_length=round(avg_length, 2),
        )
        
        # Calculate score
        metrics.score = calculate_vocabulary_score(ttr, complex_ratio, len(content_words))
        
        return metrics
    
    # =========================================================================
    # FLUENCY ANALYSIS
    # =========================================================================
    
    def analyze_fluency(
        self,
        text: str,
        total_duration: float,
        language: str = 'pt-BR',
        segments: Optional[List[Dict]] = None
    ) -> FluencyMetrics:
        """
        Analyze speech fluency.
        
        Args:
            text: Transcribed text
            total_duration: Audio duration
            language: Language code
            segments: Optional timing segments
            
        Returns:
            FluencyMetrics with fluency analysis
        """
        words = self._extract_words(text)
        total_words = len(words)
        
        if total_words == 0:
            return FluencyMetrics(
                filler_words_count=0,
                filler_words_list=[],
                filler_ratio=0.0,
            )
        
        # Detect filler words
        filler_set = FILLER_WORDS.get(language, FILLER_WORDS['pt-BR'])
        found_fillers = [w for w in words if w in filler_set]
        filler_count = len(found_fillers)
        filler_ratio = filler_count / total_words
        
        # Detect repetitions
        repetitions = 0
        for i in range(1, len(words)):
            if words[i] == words[i-1]:
                repetitions += 1
        repetition_ratio = repetitions / total_words
        
        # Detect self-corrections (similar consecutive words)
        corrections = 0
        for i in range(1, len(words)):
            if words[i] != words[i-1]:
                ratio = SequenceMatcher(None, words[i-1], words[i]).ratio()
                if 0.5 < ratio < 0.9:
                    corrections += 1
        
        metrics = FluencyMetrics(
            filler_words_count=filler_count,
            filler_words_list=list(set(found_fillers))[:10],
            filler_ratio=round(filler_ratio, 3),
            repetitions_count=repetitions,
            repetition_ratio=round(repetition_ratio, 3),
            false_starts=corrections,
        )
        
        # Calculate score
        metrics.score = calculate_fluency_score(
            filler_ratio,
            repetition_ratio,
            corrections,
            total_words
        )
        
        return metrics
    
    # =========================================================================
    # COMPREHENSIVE ANALYSIS
    # =========================================================================
    
    def analyze_comprehensive(
        self,
        text: str,
        total_duration: float,
        segments: Optional[List[Dict]] = None,
        language_hint: Optional[str] = None
    ) -> AdvancedAnalysisResult:
        """
        Perform comprehensive speech analysis with automatic language detection.
        
        Args:
            text: Transcribed text
            total_duration: Total audio duration in seconds
            segments: Optional list of segments with timing info
            language_hint: Optional language hint
            
        Returns:
            AdvancedAnalysisResult with all metrics and feedback
        """
        logger.info("🔍 Performing comprehensive speech analysis...")
        
        # Detect language
        if language_hint:
            lang_code = self._normalize_language_hint(language_hint)
            language = LanguageDetectionResult(
                detected_language=lang_code,
                confidence=1.0,
            )
        else:
            language = self.detect_language(text)
        
        lang_str = language.detected_language.value
        logger.info(f"🌍 Using language: {lang_str}")
        
        # Perform all analyses
        speech_rate = self.analyze_speech_rate(text, total_duration, lang_str, segments)
        pauses = self.analyze_pauses(total_duration, segments)
        vocabulary = self.analyze_vocabulary(text, lang_str)
        fluency = self.analyze_fluency(text, total_duration, lang_str, segments)
        
        # Generate feedback
        feedback = self._generate_feedback(
            language, speech_rate, pauses, vocabulary, fluency
        )
        
        # Create result
        result = AdvancedAnalysisResult(
            language=language,
            speech_rate=speech_rate,
            pauses=pauses,
            vocabulary=vocabulary,
            fluency=fluency,
            feedback=feedback,
        )
        
        # Calculate overall score
        result.calculate_overall_score()
        
        logger.info(f"✅ Analysis complete. Score: {result.overall_score:.1f}")
        
        return result
    
    # =========================================================================
    # FEEDBACK GENERATION
    # =========================================================================
    
    def _generate_feedback(
        self,
        language: LanguageDetectionResult,
        speech_rate: SpeechRateMetrics,
        pauses: PauseMetrics,
        vocabulary: VocabularyMetrics,
        fluency: FluencyMetrics
    ) -> List[FeedbackItem]:
        """Generate feedback items based on analysis results."""
        feedback = []
        lang = language.detected_language.value
        messages = FEEDBACK_MESSAGES.get(lang, FEEDBACK_MESSAGES['pt-BR'])
        
        # Language detection feedback
        if lang == 'en-US':
            feedback.append(FeedbackItem(
                message=f"🌍 Language detected: English (confidence: {language.confidence:.0%})",
                severity=FeedbackSeverity.INFO,
                category="language",
            ))
        else:
            feedback.append(FeedbackItem(
                message=f"🌍 Idioma detectado: Português (confiança: {language.confidence:.0%})",
                severity=FeedbackSeverity.INFO,
                category="language",
            ))
        
        # Speech rate feedback
        rate_feedback = self._get_speech_rate_feedback(speech_rate, messages)
        feedback.extend(rate_feedback)
        
        # Pause feedback
        pause_feedback = self._get_pause_feedback(pauses, messages)
        feedback.extend(pause_feedback)
        
        # Vocabulary feedback
        vocab_feedback = self._get_vocabulary_feedback(vocabulary, messages)
        feedback.extend(vocab_feedback)
        
        # Fluency feedback
        fluency_feedback = self._get_fluency_feedback(fluency, messages)
        feedback.extend(fluency_feedback)
        
        return feedback
    
    def _get_speech_rate_feedback(
        self,
        metrics: SpeechRateMetrics,
        messages: Dict
    ) -> List[FeedbackItem]:
        """Generate speech rate feedback."""
        items = []
        wpm = metrics.words_per_minute
        
        if metrics.classification.is_optimal():
            items.append(FeedbackItem(
                message=messages['speech_rate']['optimal'],
                severity=FeedbackSeverity.SUCCESS,
                category="speech_rate",
                metric_value=wpm,
            ))
        elif metrics.classification in {SpeechRateClassification.TOO_SLOW, SpeechRateClassification.SLOW}:
            items.append(FeedbackItem(
                message=messages['speech_rate'].get('too_slow', messages['speech_rate'].get('slow')),
                severity=FeedbackSeverity.WARNING,
                category="speech_rate",
                metric_value=wpm,
            ))
        else:
            items.append(FeedbackItem(
                message=messages['speech_rate'].get('too_fast', messages['speech_rate'].get('fast')),
                severity=FeedbackSeverity.WARNING,
                category="speech_rate",
                metric_value=wpm,
            ))
        
        return items
    
    def _get_pause_feedback(
        self,
        metrics: PauseMetrics,
        messages: Dict
    ) -> List[FeedbackItem]:
        """Generate pause feedback."""
        items = []
        
        if metrics.pause_ratio > 0.3:
            items.append(FeedbackItem(
                message=messages['pauses']['too_many'],
                severity=FeedbackSeverity.WARNING,
                category="pauses",
            ))
        elif metrics.pause_ratio < 0.1 and metrics.total_pauses > 0:
            items.append(FeedbackItem(
                message=messages['pauses']['too_few'],
                severity=FeedbackSeverity.INFO,
                category="pauses",
            ))
        else:
            items.append(FeedbackItem(
                message=messages['pauses']['good'],
                severity=FeedbackSeverity.SUCCESS,
                category="pauses",
            ))
        
        return items
    
    def _get_vocabulary_feedback(
        self,
        metrics: VocabularyMetrics,
        messages: Dict
    ) -> List[FeedbackItem]:
        """Generate vocabulary feedback."""
        items = []
        
        if metrics.vocabulary_level == VocabularyLevel.BASIC:
            items.append(FeedbackItem(
                message=messages['vocabulary']['basic'],
                severity=FeedbackSeverity.INFO,
                category="vocabulary",
            ))
        elif metrics.vocabulary_level in {VocabularyLevel.ADVANCED, VocabularyLevel.EXPERT}:
            items.append(FeedbackItem(
                message=messages['vocabulary']['advanced'],
                severity=FeedbackSeverity.SUCCESS,
                category="vocabulary",
            ))
        else:
            items.append(FeedbackItem(
                message=messages['vocabulary']['intermediate'],
                severity=FeedbackSeverity.SUCCESS,
                category="vocabulary",
            ))
        
        return items
    
    def _get_fluency_feedback(
        self,
        metrics: FluencyMetrics,
        messages: Dict
    ) -> List[FeedbackItem]:
        """Generate fluency feedback."""
        items = []
        
        if metrics.filler_words_count == 0:
            items.append(FeedbackItem(
                message=messages['fluency']['no_fillers'],
                severity=FeedbackSeverity.SUCCESS,
                category="fluency",
            ))
        elif metrics.filler_ratio > 0.05:
            msg = messages['fluency']['many_fillers'].format(metrics.filler_words_count)
            items.append(FeedbackItem(
                message=msg,
                severity=FeedbackSeverity.WARNING,
                category="fluency",
            ))
        else:
            items.append(FeedbackItem(
                message=messages['fluency']['few_fillers'],
                severity=FeedbackSeverity.SUCCESS,
                category="fluency",
            ))
        
        return items
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _extract_words(self, text: str) -> List[str]:
        """Extract words from text."""
        text = text.lower()
        return re.findall(r'\b[a-záéíóúàèìòùâêîôûãõäëïöüç]+\b', text)
    
    def _calculate_pause_duration(self, segments: Optional[List[Dict]]) -> float:
        """Calculate total pause duration from segments."""
        if not segments or len(segments) < 2:
            return 0.0
        
        total_pause = 0.0
        for i in range(1, len(segments)):
            gap = segments[i].get('start', 0) - segments[i-1].get('end', 0)
            if gap >= self.MIN_PAUSE_DURATION:
                total_pause += gap
        
        return total_pause
    
    def _extract_pauses(self, segments: Optional[List[Dict]]) -> List[float]:
        """Extract pause durations from segments."""
        if not segments or len(segments) < 2:
            return []
        
        pauses = []
        for i in range(1, len(segments)):
            gap = segments[i].get('start', 0) - segments[i-1].get('end', 0)
            if gap >= self.MIN_PAUSE_DURATION:
                pauses.append(gap)
        
        return pauses
    
    def _normalize_language_hint(self, hint: str) -> LanguageCode:
        """Normalize language hint to LanguageCode."""
        hint_lower = hint.lower()
        if hint_lower in ['pt', 'pt-br', 'portuguese', 'portugues']:
            return LanguageCode.PORTUGUESE_BR
        elif hint_lower in ['en', 'en-us', 'english', 'ingles']:
            return LanguageCode.ENGLISH_US
        else:
            return LanguageCode.PORTUGUESE_BR
    
    def to_dict(self, analysis: AdvancedAnalysisResult) -> Dict:
        """Convert analysis to dictionary for JSON serialization."""
        return analysis.to_dict()


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_speech_analysis_service: Optional[SpeechAnalysisService] = None


def get_speech_analysis_service() -> SpeechAnalysisService:
    """Get or create the speech analysis service singleton."""
    global _speech_analysis_service
    if _speech_analysis_service is None:
        _speech_analysis_service = SpeechAnalysisService()
    return _speech_analysis_service
