# Documentação de Métricas de Análise de Fala (Voice Meter)

Este documento detalha a lógica fonoaudiológica e os cálculos matemáticos utilizados pelo sistema **Voice Meter** para analisar a fala do usuário. O sistema baseia-se em pesquisas sobre taxa de fala ideal, padrões de pausa e inteligibilidade.

## 1. Conceitos Fundamentais

O sistema diferencia duas métricas principais de velocidade, cruciais para uma análise fonoaudiológica precisa:

*   **Speech Rate (SR) - Taxa de Fala Global**: Calcula a velocidade da fala considerando todo o tempo da gravação, *incluindo* as pausas. É uma medida geral do fluxo de informação.
*   **Articulation Rate (AR) - Taxa de Articulação**: Calcula a velocidade da fala considerando *apenas* os momentos de produção vocal ativa, *excluindo* as pausas. Esta é a métrica principal para avaliar a agilidade motora da fala e é a usada para comparação com as metas ideais.

## 2. Detecção de Sílabas e Palavras

Como o sistema não realiza transcrição completa (Speech-to-Text) para contar palavras exatas, ele utiliza processamento de sinal de áudio para estimar a contagem.

### Detecção de Onsets (Sílabas)
O sistema utiliza a biblioteca `librosa` para detectar "onsets" (inícios súbitos de energia no áudio), que funcionam como um proxy para sílabas.

```python
# backend/app/services/speech_analyzer.py

# Detect onsets (sudden increases in energy - approximates syllables)
onset_env = librosa.onset.onset_strength(y=y, sr=sr, aggregate=np.median)
onsets = librosa.onset.onset_detect(
    onset_envelope=onset_env,
    sr=sr,
    backtrack=True,
    units='time',
    pre_max=3, post_max=3, pre_avg=3, post_avg=3, # Sensitive parameters
    delta=0.1,
    wait=0.05
)
```

### Conversão Sílabas → Palavras
Para converter a contagem de sílabas em palavras (PPM), o sistema utiliza um fator de conversão baseado na média do Português Brasileiro (2.7), com ajuste dinâmico baseado na densidade de onsets.

```python
# backend/app/services/speech_analyzer.py

# Dynamic syllables per word based on onset density
onset_density = num_syllables / calculation_duration

if onset_density > 4.0:
    # Very fast: likely short words
    syllables_per_word = 1.8
elif onset_density > 3.0:
    # Fast: mixed short words
    syllables_per_word = 2.2
elif onset_density < 1.5:
    # Very slow: likely longer words
    syllables_per_word = 3.0
else:
    # Normal: Portuguese average
    syllables_per_word = 2.7

num_words = num_syllables / syllables_per_word
```

## 3. Cálculos das Métricas

### 3.1. Palavras Por Minuto (PPM)

#### Articulation Rate (AR) - Métrica Principal
$$ AR = \frac{\text{Palavras em Segmentos Ativos}}{\text{Duração da Fala Ativa (minutos)}} $$

O cálculo do AR inclui uma lógica híbrida: se o VAD (Voice Activity Detection) for muito agressivo (cortar demais), o sistema usa um cálculo direto para evitar subestimar a velocidade.

```python
# backend/app/services/speech_analyzer.py

def _calculate_articulation_rate(self, y: np.ndarray, sr: int, speech_analysis: Dict) -> float:
    # ... (código omitido)
    
    # HYBRID APPROACH: If VAD filtered out too many onsets, use direct calculation
    if speech_ratio < 0.4 and retention_rate < 0.5:
        # Use all onsets but with active duration for more realistic rate
        num_syllables = total_onsets
        calculation_duration = active_duration
    else:
        # Standard VAD-filtered approach
        num_syllables = num_active_onsets
        calculation_duration = active_duration
        
    # ... (cálculo de palavras e conversão para minutos)
    ar_wpm = num_words / duration_minutes
    
    # Intelligent correction based on total onset density
    if ar_wpm < 50:
        if total_onset_density < 2.0:
            ar_wpm = max(80, ar_wpm * 2.5) # Strong correction
        else:
            ar_wpm = max(80, ar_wpm * 1.8)
    elif ar_wpm > 250:
        ar_wpm = min(220, ar_wpm * 0.85)
        
    return ar_wpm
```

### 3.2. Análise de Pausas e Silêncio

O sistema utiliza um limiar adaptativo para separar fala de silêncio, robusto a variações de volume.

```python
# backend/app/services/speech_analyzer.py

def _analyze_speech_activity(self, y: np.ndarray, sr: int) -> Dict:
    # Calculate RMS energy
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    
    # Adaptive threshold using percentile (more robust for fast speech)
    percentile_10 = np.percentile(rms, 10)
    percentile_90 = np.percentile(rms, 90)
    threshold = percentile_10 + (percentile_90 - percentile_10) * 0.25
    
    # Create binary mask: 1 for speech, 0 for silence
    speech_frames = rms > threshold
    
    # ...
```

### 3.3. Ritmo e Variação (Pacing)

Analisa a consistência da velocidade em janelas locais (~15 sílabas).

```python
# backend/app/services/speech_analyzer.py

def _analyze_local_pacing(self, y: np.ndarray, sr: int, speech_analysis: Dict) -> Dict:
    # ...
    # Analyze in windows of 15 syllables (approximately 5-6 words)
    window_size = 15
    local_rates = []
    
    for i in range(0, len(onsets) - window_size, window_size // 2):
        # Calculate local AR for this window
        # ...
        local_rates.append(local_ar)
    
    # Calculate variation
    mean_rate = np.mean(local_rates)
    std_rate = np.std(local_rates)
    variation_coefficient = (std_rate / mean_rate * 100) if mean_rate > 0 else 0
    
    # Consistency score (100 = perfect, 0 = highly variable)
    consistency_score = max(0, 100 - (variation_coefficient * 3))
    
    return {
        'consistency_score': consistency_score,
        'variation_coefficient': variation_coefficient,
        # ...
    }
```

### 3.4. Inteligibilidade Estimada

Um score heurístico (0-100%) que penaliza extremos de velocidade, inconsistência e pausas inadequadas.

```python
# backend/app/services/speech_analyzer.py

def _estimate_intelligibility(self, ar_wpm: float, pacing_variations: Dict, pause_analysis: Dict) -> float:
    intelligibility = 100.0
    
    # Factor 1: Articulation Rate (AR)
    if ar_wpm > 400: intelligibility *= 0.3
    elif ar_wpm > 250: intelligibility *= 0.6
    elif ar_wpm > 200: intelligibility *= 0.85
    elif ar_wpm < 80: intelligibility *= 0.9
    
    # Factor 2: Pacing Consistency
    consistency_penalty = (100 - pacing_variations['consistency_score']) / 100
    intelligibility *= (1 - consistency_penalty * 0.3)
    
    # Factor 3: Pause Patterns
    silence_ratio = pause_analysis['silence_ratio']
    if silence_ratio < 0.10:  # Less than 10% silence
        intelligibility *= 0.85
    elif silence_ratio > 0.40:  # More than 40% silence
        intelligibility *= 0.90
    
    return max(0, min(100, intelligibility))
```

## 4. Categorias e Metas (Benchmarks)

O sistema avalia o usuário comparando seu **Articulation Rate (AR)** com faixas ideais definidas no código:

```python
# backend/app/services/speech_analyzer.py

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
```

## 5. Lógica de Feedback

O sistema gera feedback textual automático combinando os dados acima:

1.  **Velocidade**: Compara AR com Min/Max da categoria. Sugere "acelerar" ou "diminuir" com a diferença exata em PPM.
2.  **Pausas**:
    *   Se silêncio < 10%: Sugere pausas estratégicas.
    *   Se silêncio > 40%: Alerta sobre hesitações excessivas.
3.  **Ritmo**: Alerta se a variação for > 20% ("ritmo inconsistente").
4.  **Inteligibilidade**: Alerta se o score for < 70%.

---
*Baseado na análise do código fonte: `backend/app/services/speech_analyzer.py`*
