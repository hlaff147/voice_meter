"""
Serviço de Análise de Fala Avançado
Baseado em pesquisa de "User speech rates and preferences for system speech rates"
(Dowding et al., International Journal of Human-Computer Studies, 2024)

Este serviço fornece métricas de fala abrangentes:
- Taxa de fala (SR) e Taxa de articulação (AR)
- Análise de pausas
- Complexidade de vocabulário
- Métricas de fluência
- Classificação de estilo de fala

NOTA: Projeto 100% focado em pt-BR (Português Brasileiro)
"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict

from app.common.constants import (
    PORTUGUESE_VOWELS,
    PORTUGUESE_FUNCTION_WORDS,
    PORTUGUESE_COMPLEX_SUFFIXES,
    SPEECH_RATE_THRESHOLDS,
    IDEAL_SPEAKING_RATE,
    FILLER_WORDS,
    PAUSE_THRESHOLD_LONG,
)

logger = logging.getLogger(__name__)

# Comprimento mínimo para palavras complexas
COMPLEX_WORD_MIN_LENGTH = 10


# =============================================================================
# DATA CLASSES (DTOs)
# =============================================================================

@dataclass
class SpeechRateMetrics:
    """Métricas relacionadas à taxa de fala."""
    speaking_rate_spm: float  # Sílabas por minuto (com pausas)
    articulation_rate_spm: float  # Sílabas por minuto (sem pausas)
    words_per_minute: float
    total_duration_seconds: float
    speech_duration_seconds: float  # Duração sem pausas
    pause_duration_seconds: float
    classification: str  # 'slow', 'medium', 'fast'
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class PauseMetrics:
    """Métricas relacionadas a pausas na fala."""
    total_pauses: int
    total_pause_duration: float
    average_pause_duration: float
    longest_pause: float
    pauses_per_minute: float
    pause_ratio: float  # Razão do tempo de pausa para tempo total
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class VocabularyMetrics:
    """Métricas relacionadas à complexidade do vocabulário."""
    total_words: int
    unique_words: int
    vocabulary_richness: float  # Type-Token Ratio (TTR)
    average_word_length: float
    complex_words_count: int
    complex_words_ratio: float
    filler_words_count: int
    filler_words_ratio: float
    lexical_density: float  # Palavras de conteúdo / Total de palavras
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class FluencyMetrics:
    """Métricas relacionadas à fluência da fala."""
    fluency_score: float  # 0-100
    hesitation_rate: float  # Hesitações por minuto
    repetition_count: int
    self_corrections_count: int
    incomplete_sentences: int
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class LanguageDetection:
    """Resultado da detecção de idioma."""
    detected_language: str = 'pt-BR'
    confidence: float = 1.0
    portuguese_score: float = 100.0
    english_score: float = 0.0
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ComprehensiveSpeechAnalysis:
    """Resultados completos da análise de fala."""
    language: LanguageDetection
    speech_rate: SpeechRateMetrics
    pauses: PauseMetrics
    vocabulary: VocabularyMetrics
    fluency: FluencyMetrics
    overall_score: float
    feedback: List[str]
    recommendations: List[str]
    
    def to_dict(self) -> Dict:
        return {
            "language": self.language.to_dict(),
            "speech_rate": self.speech_rate.to_dict(),
            "pauses": self.pauses.to_dict(),
            "vocabulary": self.vocabulary.to_dict(),
            "fluency": self.fluency.to_dict(),
            "overall_score": self.overall_score,
            "feedback": self.feedback,
            "recommendations": self.recommendations
        }


# =============================================================================
# SERVIÇO DE ANÁLISE DE FALA
# =============================================================================

class SpeechAnalysisService:
    """
    Serviço avançado de análise de fala implementando métricas de pesquisa.
    Focado 100% em Português Brasileiro (pt-BR).
    
    Valores de referência da pesquisa:
    - Taxa média de fala: ~199 síl/min (espontânea), ~237 síl/min (leitura)
    - Taxa média de articulação: ~246 síl/min (espontânea), ~288 síl/min (leitura)
    - Falantes rápidos: > 263 síl/min AR
    - Falantes lentos: < 228 síl/min AR
    """
    
    # Limites de pausa (em segundos)
    MIN_PAUSE_DURATION = 0.25  # 250ms conforme artigo
    LONG_PAUSE_THRESHOLD = 2.0
    
    def __init__(self):
        logger.info("✅ Serviço de Análise de Fala inicializado (pt-BR)")
    
    # =========================================================================
    # DETECÇÃO DE IDIOMA
    # =========================================================================
    
    def detect_language(self, text: str) -> LanguageDetection:
        """
        Retorna pt-BR pois o projeto é 100% focado em português brasileiro.
        """
        logger.info("🌍 Usando pt-BR (projeto focado 100% em português)")
        return LanguageDetection()
    
    # =========================================================================
    # ANÁLISE DE SÍLABAS
    # =========================================================================
    
    def count_syllables(self, word: str) -> int:
        """
        Conta sílabas em uma palavra portuguesa.
        
        Args:
            word: A palavra para contar sílabas
            
        Returns:
            Número de sílabas
        """
        word = word.lower().strip()
        if not word:
            return 0
        
        # Remove pontuação
        word = re.sub(r'[^\w]', '', word)
        if not word:
            return 0
        
        syllables = 0
        prev_is_vowel = False
        
        for char in word:
            is_vowel = char in PORTUGUESE_VOWELS
            if is_vowel and not prev_is_vowel:
                syllables += 1
            prev_is_vowel = is_vowel
        
        return max(1, syllables)
    
    def count_syllables_text(self, text: str) -> int:
        """Conta o total de sílabas em um texto."""
        words = self._extract_words(text)
        return sum(self.count_syllables(word) for word in words)
    
    # =========================================================================
    # UTILITÁRIOS
    # =========================================================================
    
    def _extract_words(self, text: str) -> List[str]:
        """Extrai palavras do texto, removendo pontuação."""
        text = text.lower()
        words = re.findall(r'\b[a-záéíóúàèìòùâêîôûãõäëïöüç]+\b', text)
        return words
    
    def _extract_pauses(self, segments: Optional[List[Dict]]) -> List[float]:
        """
        Extrai todas as pausas dos segmentos.
        
        Args:
            segments: Lista de segmentos com informações de tempo
            
        Returns:
            Lista de durações de pausas em segundos
        """
        if not segments or len(segments) < 2:
            return []
        
        pauses = []
        for i in range(1, len(segments)):
            gap = segments[i].get('start', 0) - segments[i-1].get('end', 0)
            if gap >= self.MIN_PAUSE_DURATION:
                pauses.append(gap)
        return pauses
    
    # =========================================================================
    # ANÁLISE DE TAXA DE FALA
    # =========================================================================
    
    def analyze_speech_rate(
        self,
        text: str,
        total_duration: float,
        segments: Optional[List[Dict]] = None
    ) -> SpeechRateMetrics:
        """
        Analisa métricas de taxa de fala.
        
        Args:
            text: Texto transcrito
            total_duration: Duração total do áudio em segundos
            segments: Lista opcional de segmentos com informações de tempo
            
        Returns:
            SpeechRateMetrics com análise detalhada da taxa
        """
        words = self._extract_words(text)
        total_syllables = self.count_syllables_text(text)
        total_words = len(words)
        
        if total_duration <= 0:
            total_duration = 1.0  # Evita divisão por zero
        
        # Calcula duração de pausas usando método reutilizável
        pauses = self._extract_pauses(segments)
        pause_duration = sum(pauses)
        speech_duration = max(0.1, total_duration - pause_duration)
        
        # Calcula taxas (por minuto)
        speaking_rate_spm = (total_syllables / total_duration) * 60
        articulation_rate_spm = (total_syllables / speech_duration) * 60
        words_per_minute = (total_words / total_duration) * 60
        
        # Classifica ritmo do falante
        if articulation_rate_spm < SPEECH_RATE_THRESHOLDS['slow']:
            classification = 'slow'
        elif articulation_rate_spm > SPEECH_RATE_THRESHOLDS['fast']:
            classification = 'fast'
        else:
            classification = 'medium'
        
        return SpeechRateMetrics(
            speaking_rate_spm=round(speaking_rate_spm, 1),
            articulation_rate_spm=round(articulation_rate_spm, 1),
            words_per_minute=round(words_per_minute, 1),
            total_duration_seconds=round(total_duration, 2),
            speech_duration_seconds=round(speech_duration, 2),
            pause_duration_seconds=round(pause_duration, 2),
            classification=classification
        )
    
    # =========================================================================
    # ANÁLISE DE PAUSAS
    # =========================================================================
    
    def analyze_pauses(
        self,
        total_duration: float,
        segments: Optional[List[Dict]] = None
    ) -> PauseMetrics:
        """
        Analisa padrões de pausas na fala.
        
        Pausas são indicadores importantes de:
        - Hesitação e incerteza
        - Padrões naturais de respiração
        - Ênfase e efeito dramático
        """
        pauses = self._extract_pauses(segments)
        
        total_pauses = len(pauses)
        total_pause_duration = sum(pauses)
        
        if total_pauses > 0:
            average_pause = total_pause_duration / total_pauses
            longest_pause = max(pauses)
        else:
            average_pause = 0.0
            longest_pause = 0.0
        
        if total_duration > 0:
            pauses_per_minute = (total_pauses / total_duration) * 60
            pause_ratio = total_pause_duration / total_duration
        else:
            pauses_per_minute = 0.0
            pause_ratio = 0.0
        
        return PauseMetrics(
            total_pauses=total_pauses,
            total_pause_duration=round(total_pause_duration, 2),
            average_pause_duration=round(average_pause, 2),
            longest_pause=round(longest_pause, 2),
            pauses_per_minute=round(pauses_per_minute, 1),
            pause_ratio=round(pause_ratio, 3)
        )
    
    # =========================================================================
    # ANÁLISE DE VOCABULÁRIO
    # =========================================================================
    
    def analyze_vocabulary(self, text: str) -> VocabularyMetrics:
        """
        Analisa complexidade e riqueza do vocabulário.
        
        Métricas incluem:
        - Type-Token Ratio (riqueza de vocabulário)
        - Uso de palavras complexas
        - Frequência de palavras de preenchimento
        - Densidade lexical
        """
        words = self._extract_words(text)
        total_words = len(words)
        
        if total_words == 0:
            return VocabularyMetrics(
                total_words=0,
                unique_words=0,
                vocabulary_richness=0.0,
                average_word_length=0.0,
                complex_words_count=0,
                complex_words_ratio=0.0,
                filler_words_count=0,
                filler_words_ratio=0.0,
                lexical_density=0.0
            )
        
        # Palavras únicas (Type-Token Ratio)
        unique_words = len(set(words))
        vocabulary_richness = unique_words / total_words
        
        # Comprimento médio das palavras
        total_length = sum(len(word) for word in words)
        average_word_length = total_length / total_words
        
        # Palavras complexas (palavras longas ou com sufixos complexos)
        complex_words = [
            word for word in words
            if len(word) >= COMPLEX_WORD_MIN_LENGTH
            or any(word.endswith(suffix) for suffix in PORTUGUESE_COMPLEX_SUFFIXES)
        ]
        complex_words_count = len(complex_words)
        complex_words_ratio = complex_words_count / total_words
        
        # Palavras de preenchimento
        filler_set = FILLER_WORDS.get('pt-BR', set())
        filler_count = sum(1 for word in words if word in filler_set)
        filler_ratio = filler_count / total_words
        
        # Densidade lexical (palavras de conteúdo vs palavras funcionais)
        content_words = sum(1 for word in words if word not in PORTUGUESE_FUNCTION_WORDS)
        lexical_density = content_words / total_words
        
        return VocabularyMetrics(
            total_words=total_words,
            unique_words=unique_words,
            vocabulary_richness=round(vocabulary_richness, 3),
            average_word_length=round(average_word_length, 2),
            complex_words_count=complex_words_count,
            complex_words_ratio=round(complex_words_ratio, 3),
            filler_words_count=filler_count,
            filler_words_ratio=round(filler_ratio, 3),
            lexical_density=round(lexical_density, 3)
        )
    
    # =========================================================================
    # ANÁLISE DE FLUÊNCIA
    # =========================================================================
    
    def analyze_fluency(
        self,
        text: str,
        total_duration: float,
        segments: Optional[List[Dict]] = None
    ) -> FluencyMetrics:
        """
        Analisa a fluência da fala.
        
        Indicadores de fluência:
        - Taxa de hesitação (pausas longas)
        - Repetições de palavras
        - Autocorreções
        - Frases incompletas
        """
        words = self._extract_words(text)
        
        # Conta repetições (palavras idênticas consecutivas)
        repetitions = 0
        for i in range(1, len(words)):
            if words[i] == words[i-1]:
                repetitions += 1
        
        # Conta autocorreções (palavras seguidas por palavras similares)
        self_corrections = 0
        for i in range(1, len(words)):
            if words[i] != words[i-1]:
                from difflib import SequenceMatcher
                ratio = SequenceMatcher(None, words[i-1], words[i]).ratio()
                if 0.5 < ratio < 0.9:  # Similar mas não idêntico
                    self_corrections += 1
        
        # Conta frases incompletas (estimativa aproximada)
        sentences = re.split(r'[.!?]', text)
        incomplete = sum(1 for s in sentences if len(s.strip().split()) < 3 and len(s.strip()) > 0)
        
        # Conta hesitações (pausas longas)
        hesitations = 0
        if segments and len(segments) > 1:
            for i in range(1, len(segments)):
                gap = segments[i].get('start', 0) - segments[i-1].get('end', 0)
                if gap >= self.LONG_PAUSE_THRESHOLD:
                    hesitations += 1
        
        # Calcula taxa de hesitação
        if total_duration > 0:
            hesitation_rate = (hesitations / total_duration) * 60
        else:
            hesitation_rate = 0.0
        
        # Calcula pontuação de fluência (0-100)
        base_score = 100
        penalty = 0
        
        if len(words) > 0:
            penalty += (repetitions / len(words)) * 20
            penalty += (self_corrections / len(words)) * 15
            penalty += hesitation_rate * 5
            penalty += incomplete * 3
        
        fluency_score = max(0, min(100, base_score - penalty))
        
        return FluencyMetrics(
            fluency_score=round(fluency_score, 1),
            hesitation_rate=round(hesitation_rate, 2),
            repetition_count=repetitions,
            self_corrections_count=self_corrections,
            incomplete_sentences=incomplete
        )
    
    # =========================================================================
    # GERAÇÃO DE FEEDBACK
    # =========================================================================
    
    def generate_feedback(
        self,
        language_detection: LanguageDetection,
        speech_rate: SpeechRateMetrics,
        pauses: PauseMetrics,
        vocabulary: VocabularyMetrics,
        fluency: FluencyMetrics
    ) -> Tuple[List[str], List[str]]:
        """Gera feedback e recomendações legíveis em português."""
        feedback = []
        recommendations = []
        
        # Idioma detectado
        feedback.append(f"🌍 Idioma: Português (confiança: {language_detection.confidence:.0%})")
        
        # Feedback de taxa de fala
        if speech_rate.classification == 'fast':
            feedback.append("🏃 Você está falando relativamente rápido.")
            recommendations.append("Tente desacelerar um pouco para melhor compreensão.")
        elif speech_rate.classification == 'slow':
            feedback.append("🐢 Seu ritmo de fala está lento.")
            recommendations.append("Considere acelerar levemente para manter o engajamento.")
        else:
            feedback.append("✅ Seu ritmo de fala está adequado.")
        
        # Feedback de palavras por minuto
        wpm = speech_rate.words_per_minute
        if wpm < IDEAL_SPEAKING_RATE['min']:
            feedback.append(f"📊 Taxa: {wpm:.0f} palavras/min (abaixo do ideal: {IDEAL_SPEAKING_RATE['min']}-{IDEAL_SPEAKING_RATE['max']}).")
        elif wpm > IDEAL_SPEAKING_RATE['max']:
            feedback.append(f"📊 Taxa: {wpm:.0f} palavras/min (acima do ideal: {IDEAL_SPEAKING_RATE['min']}-{IDEAL_SPEAKING_RATE['max']}).")
        else:
            feedback.append(f"📊 Taxa: {wpm:.0f} palavras/min (dentro do ideal!).")
        
        # Feedback de pausas
        if pauses.pause_ratio > 0.3:
            feedback.append("⏸️ Muitas pausas detectadas.")
            recommendations.append("Tente reduzir as pausas para maior fluidez.")
        elif pauses.pause_ratio < 0.1 and speech_rate.total_duration_seconds > 10:
            feedback.append("⚡ Poucas pausas - você está falando sem parar.")
            recommendations.append("Pausas estratégicas ajudam na compreensão.")
        
        if pauses.longest_pause > 3.0:
            feedback.append(f"⚠️ Pausa longa detectada: {pauses.longest_pause:.1f}s")
        
        # Feedback de vocabulário
        if vocabulary.vocabulary_richness < 0.4:
            feedback.append("📝 Vocabulário repetitivo detectado.")
            recommendations.append("Tente usar sinônimos para enriquecer o texto.")
        elif vocabulary.vocabulary_richness > 0.7:
            feedback.append("📚 Excelente variedade de vocabulário!")
        
        if vocabulary.filler_words_ratio > 0.1:
            feedback.append(f"💬 Alto uso de palavras de preenchimento ({vocabulary.filler_words_count} detectadas).")
            recommendations.append("Reduza o uso de 'tipo', 'então', 'né', etc.")
        
        if vocabulary.complex_words_ratio > 0.15:
            feedback.append("🎓 Bom uso de vocabulário complexo/técnico.")
        
        # Feedback de fluência
        if fluency.fluency_score >= 80:
            feedback.append("🌟 Excelente fluência!")
        elif fluency.fluency_score >= 60:
            feedback.append("👍 Boa fluência geral.")
        else:
            feedback.append("📈 Há espaço para melhorar a fluência.")
        
        if fluency.repetition_count > 3:
            feedback.append(f"🔄 {fluency.repetition_count} repetições de palavras detectadas.")
            recommendations.append("Evite repetir palavras consecutivamente.")
        
        if fluency.self_corrections_count > 2:
            feedback.append(f"✏️ {fluency.self_corrections_count} autocorreções detectadas.")
            recommendations.append("Pratique mais para reduzir autocorreções.")
        
        return feedback, recommendations
    
    # =========================================================================
    # ANÁLISE ABRANGENTE
    # =========================================================================
    
    def analyze_comprehensive(
        self,
        text: str,
        total_duration: float,
        segments: Optional[List[Dict]] = None,
        language_hint: Optional[str] = None
    ) -> ComprehensiveSpeechAnalysis:
        """
        Realiza análise abrangente de fala.
        
        Args:
            text: Texto transcrito
            total_duration: Duração total do áudio em segundos
            segments: Lista opcional de segmentos com informações de tempo
            language_hint: Dica opcional de idioma (ignorado, sempre pt-BR)
            
        Returns:
            ComprehensiveSpeechAnalysis com todas as métricas
        """
        logger.info("🔍 Realizando análise abrangente de fala...")
        
        # Sempre usa pt-BR
        detected_lang = self.detect_language(text)
        logger.info("🌍 Usando idioma: pt-BR")
        
        # Analisa todos os componentes
        speech_rate = self.analyze_speech_rate(text, total_duration, segments)
        pauses = self.analyze_pauses(total_duration, segments)
        vocabulary = self.analyze_vocabulary(text)
        fluency = self.analyze_fluency(text, total_duration, segments)
        
        # Gera feedback em português
        feedback, recommendations = self.generate_feedback(
            detected_lang, speech_rate, pauses, vocabulary, fluency
        )
        
        # Calcula pontuação geral (média ponderada)
        overall_score = (
            self._score_speech_rate(speech_rate) * 0.25 +
            self._score_pauses(pauses) * 0.15 +
            self._score_vocabulary(vocabulary) * 0.25 +
            fluency.fluency_score * 0.35
        )
        
        logger.info(f"✅ Análise completa. Pontuação geral: {overall_score:.1f}")
        
        return ComprehensiveSpeechAnalysis(
            language=detected_lang,
            speech_rate=speech_rate,
            pauses=pauses,
            vocabulary=vocabulary,
            fluency=fluency,
            overall_score=round(overall_score, 1),
            feedback=feedback,
            recommendations=recommendations
        )
    
    # =========================================================================
    # CÁLCULO DE PONTUAÇÃO
    # =========================================================================
    
    def _score_speech_rate(self, sr: SpeechRateMetrics) -> float:
        """Converte taxa de fala para pontuação 0-100."""
        wpm = sr.words_per_minute
        
        # Faixa ideal
        if IDEAL_SPEAKING_RATE['min'] <= wpm <= IDEAL_SPEAKING_RATE['max']:
            return 100.0
        
        # Calcula distância da faixa ideal
        if wpm < IDEAL_SPEAKING_RATE['min']:
            distance = IDEAL_SPEAKING_RATE['min'] - wpm
        else:
            distance = wpm - IDEAL_SPEAKING_RATE['max']
        
        # Penaliza 2 pontos por wpm fora do ideal
        return max(0, 100 - distance * 2)
    
    def _score_pauses(self, p: PauseMetrics) -> float:
        """Converte métricas de pausa para pontuação 0-100."""
        # Razão ideal de pausa: 0.1-0.25
        if 0.1 <= p.pause_ratio <= 0.25:
            base_score = 100.0
        elif p.pause_ratio < 0.1:
            base_score = 80.0  # Poucas pausas
        else:
            # Muitas pausas
            base_score = max(0, 100 - (p.pause_ratio - 0.25) * 200)
        
        # Penaliza pausas muito longas
        if p.longest_pause > 3.0:
            base_score -= 10
        
        return max(0, base_score)
    
    def _score_vocabulary(self, v: VocabularyMetrics) -> float:
        """Converte métricas de vocabulário para pontuação 0-100."""
        score = 50.0  # Pontuação base
        
        # Recompensa riqueza de vocabulário (TTR)
        score += v.vocabulary_richness * 30
        
        # Recompensa palavras complexas (até certo ponto)
        score += min(v.complex_words_ratio * 50, 15)
        
        # Penaliza palavras de preenchimento
        score -= v.filler_words_ratio * 50
        
        return max(0, min(100, score))
    
    def to_dict(self, analysis: ComprehensiveSpeechAnalysis) -> Dict:
        """Converte análise para dicionário para serialização JSON."""
        return analysis.to_dict()


# =============================================================================
# SINGLETON
# =============================================================================

_speech_analysis_service: Optional[SpeechAnalysisService] = None


def get_speech_analysis_service() -> SpeechAnalysisService:
    """Obtém ou cria o serviço de análise de fala (singleton)."""
    global _speech_analysis_service
    if _speech_analysis_service is None:
        _speech_analysis_service = SpeechAnalysisService()
    return _speech_analysis_service
