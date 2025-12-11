"""
Application constants module.

Contains all static configuration values and reference data.
"""

from typing import Dict, List, Set

# =============================================================================
# SUPPORTED LANGUAGES
# =============================================================================

SUPPORTED_LANGUAGES = ["pt-BR", "en-US"]
DEFAULT_LANGUAGE = "pt-BR"

# =============================================================================
# PORTUGUESE LANGUAGE CONFIGURATION (projeto 100% pt-BR)
# =============================================================================

PORTUGUESE_VOWELS = set('aeiouáéíóúàèìòùâêîôûãõäëïöü')
PORTUGUESE_DIGRAPHS = ['lh', 'nh', 'ch', 'rr', 'ss', 'qu', 'gu']

# Portuguese function words for lexical density
PORTUGUESE_FUNCTION_WORDS = {
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
    'por', 'para', 'com', 'sem', 'sob', 'sobre',
    'e', 'ou', 'mas', 'porém', 'contudo', 'todavia',
    'que', 'qual', 'quais', 'quem', 'onde', 'quando', 'como',
    'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
    'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
    'meu', 'minha', 'teu', 'tua', 'seu', 'sua', 'nosso', 'nossa',
    'este', 'esta', 'esse', 'essa', 'aquele', 'aquela',
    'isto', 'isso', 'aquilo', 'ser', 'estar', 'ter', 'haver',
    'é', 'são', 'foi', 'foram', 'será', 'seria'
}

# Portuguese complex word suffixes
PORTUGUESE_COMPLEX_SUFFIXES = [
    'mente', 'ção', 'ções', 'dade', 'ismo', 'ista',
    'ível', 'ável', 'ência', 'ância', 'mento', 'tivo'
]

# =============================================================================
# SPEECH RATE THRESHOLDS (pt-BR focused)
# =============================================================================

# Articulation rate thresholds (syllables per minute)
SPEECH_RATE_THRESHOLDS = {
    'slow': 180,
    'fast': 250
}

# Ideal speaking rates for presentations (words per minute)
IDEAL_SPEAKING_RATE = {
    'min': 140,
    'max': 170
}

# =============================================================================
# SPEECH RATE CONSTANTS (based on research paper)
# =============================================================================

# Optimal words per minute range
OPTIMAL_WPM_MIN = 140
OPTIMAL_WPM_MAX = 180
IDEAL_WPM_MIN = 150
IDEAL_WPM_MAX = 165

# Syllables per second (alternative metric)
OPTIMAL_SYLLABLES_PER_SECOND_MIN = 3.5
OPTIMAL_SYLLABLES_PER_SECOND_MAX = 4.5

# =============================================================================
# PAUSE THRESHOLDS (in seconds)
# =============================================================================

PAUSE_THRESHOLD_MICRO = 0.3
PAUSE_THRESHOLD_SHORT = 0.5
PAUSE_THRESHOLD_MEDIUM = 1.0
PAUSE_THRESHOLD_LONG = 2.0

# Maximum pause before considered problematic
MAX_ACCEPTABLE_PAUSE = 3.0

# =============================================================================
# VOCABULARY THRESHOLDS
# =============================================================================

# Type-Token Ratio thresholds for diversity
TTR_LOW = 0.3
TTR_MEDIUM = 0.5
TTR_HIGH = 0.7

# Minimum words for reliable vocabulary analysis
MIN_WORDS_FOR_VOCABULARY_ANALYSIS = 50

# =============================================================================
# FLUENCY THRESHOLDS
# =============================================================================

# Maximum filler words percentage (ideal)
MAX_FILLER_PERCENTAGE = 3.0

# Maximum repetitions percentage (ideal)
MAX_REPETITION_PERCENTAGE = 2.0

# =============================================================================
# FILLER WORDS BY LANGUAGE
# =============================================================================

FILLER_WORDS: Dict[str, Set[str]] = {
    "pt-BR": {
        # Common fillers
        "é", "ã", "hum", "humm", "hummm", "eh", "ehh", "ehhh",
        "ah", "ahh", "ahhh", "ahn", "ãhn",
        # Verbal tics
        "né", "ne", "sabe", "tipo", "assim", "então", "entao",
        "bom", "bem", "olha", "veja", "certo",
        # Hesitation markers
        "quer dizer", "como assim", "deixa eu ver",
        "como é que é", "como que é",
        # Common speech patterns
        "na verdade", "basicamente", "literalmente", "sinceramente",
        "honestamente", "obviamente", "claramente",
        # Connective fillers
        "tipo assim", "sei lá", "sei la", "enfim",
        "aí", "ai", "daí", "dai",
    },
    "en-US": {
        # Common fillers
        "um", "umm", "ummm", "uh", "uhh", "uhhh",
        "ah", "ahh", "ahhh", "er", "err", "errr",
        # Verbal tics
        "like", "you know", "right", "so", "well", "basically",
        "actually", "literally", "honestly", "obviously",
        # Hesitation markers
        "i mean", "let me see", "how do i say",
        "what's the word", "you see",
        # Common speech patterns
        "kind of", "sort of", "kinda", "sorta",
        "i guess", "i think", "i suppose",
        # Connective fillers
        "anyway", "anyways", "whatever", "whatnot",
    },
}

# =============================================================================
# STOPWORDS BY LANGUAGE
# =============================================================================

STOPWORDS: Dict[str, Set[str]] = {
    "pt-BR": {
        "a", "o", "e", "de", "da", "do", "que", "em", "um", "uma",
        "para", "com", "não", "nao", "se", "na", "os", "as", "dos", "das",
        "por", "mais", "foi", "são", "sao", "como", "mas", "ao", "ou",
        "ser", "seu", "sua", "quando", "muito", "nos", "já", "ja", "eu",
        "também", "tambem", "só", "so", "pelo", "pela", "até", "ate",
        "isso", "ela", "entre", "depois", "sem", "mesmo", "aos", "ter",
        "seus", "quem", "nas", "me", "esse", "eles", "você", "voce",
        "essa", "num", "nem", "suas", "meu", "às", "as", "minha", "têm",
        "tem", "numa", "pelos", "elas", "havia", "seja", "qual", "será",
        "sera", "nós", "nos", "tenho", "lhe", "deles", "essas", "esses",
        "pelas", "este", "fosse", "dele", "tu", "te", "vocês", "voces",
        "lhes", "meus", "minhas", "teu", "tua", "teus", "tuas", "nosso",
        "nossa", "nossos", "nossas", "dela", "delas", "esta", "estes",
        "estas", "aquele", "aquela", "aqueles", "aquelas", "isto", "aquilo",
    },
    "en-US": {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "as", "is", "was", "are", "were",
        "been", "be", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "must", "shall",
        "can", "need", "dare", "ought", "used", "i", "you", "he", "she",
        "it", "we", "they", "me", "him", "her", "us", "them", "my", "your",
        "his", "its", "our", "their", "mine", "yours", "hers", "ours",
        "theirs", "this", "that", "these", "those", "what", "which", "who",
        "whom", "whose", "where", "when", "why", "how", "all", "each",
        "every", "both", "few", "more", "most", "other", "some", "such",
        "no", "nor", "not", "only", "own", "same", "so", "than", "too",
        "very", "just", "also", "now", "here", "there", "then", "once",
    },
}

# =============================================================================
# COMPLEX WORD PATTERNS BY LANGUAGE
# =============================================================================

# Minimum syllables for a word to be considered complex
COMPLEX_WORD_MIN_SYLLABLES: Dict[str, int] = {
    "pt-BR": 4,  # Portuguese tends to have longer words naturally
    "en-US": 3,  # English complex words start at 3 syllables
}

# =============================================================================
# FEEDBACK MESSAGES
# =============================================================================

FEEDBACK_MESSAGES = {
    "pt-BR": {
        "speech_rate": {
            "too_slow": "Sua velocidade de fala está muito lenta. Tente aumentar o ritmo para manter o engajamento.",
            "slow": "Sua fala está um pouco lenta. Considere um ritmo ligeiramente mais rápido.",
            "optimal": "Excelente! Sua velocidade de fala está na faixa ideal.",
            "fast": "Sua fala está um pouco rápida. Considere desacelerar para melhor compreensão.",
            "too_fast": "Sua velocidade de fala está muito rápida. Reduza o ritmo significativamente.",
        },
        "pauses": {
            "too_few": "Você está fazendo poucas pausas. Adicione mais pausas para dar ritmo e permitir absorção.",
            "good": "Bom uso de pausas! Elas ajudam na compreensão.",
            "too_many": "Você está fazendo muitas pausas longas. Tente manter um fluxo mais consistente.",
        },
        "vocabulary": {
            "basic": "Vocabulário básico detectado. Considere usar termos mais variados.",
            "intermediate": "Bom vocabulário. Continue diversificando suas palavras.",
            "advanced": "Excelente diversidade vocabular!",
        },
        "fluency": {
            "many_fillers": "Muitas palavras de preenchimento detectadas ({}). Tente reduzir 'hum', 'é', 'tipo'.",
            "few_fillers": "Bom controle de palavras de preenchimento.",
            "no_fillers": "Excelente! Nenhuma palavra de preenchimento detectada.",
        },
    },
    "en-US": {
        "speech_rate": {
            "too_slow": "Your speech rate is too slow. Try increasing your pace to maintain engagement.",
            "slow": "Your speech is a bit slow. Consider a slightly faster pace.",
            "optimal": "Excellent! Your speech rate is in the ideal range.",
            "fast": "Your speech is a bit fast. Consider slowing down for better comprehension.",
            "too_fast": "Your speech rate is too fast. Significantly reduce your pace.",
        },
        "pauses": {
            "too_few": "You're making too few pauses. Add more pauses for rhythm and absorption.",
            "good": "Good use of pauses! They help with comprehension.",
            "too_many": "You're making too many long pauses. Try to maintain a more consistent flow.",
        },
        "vocabulary": {
            "basic": "Basic vocabulary detected. Consider using more varied terms.",
            "intermediate": "Good vocabulary. Keep diversifying your words.",
            "advanced": "Excellent vocabulary diversity!",
        },
        "fluency": {
            "many_fillers": "Many filler words detected ({}). Try reducing 'um', 'like', 'you know'.",
            "few_fillers": "Good control of filler words.",
            "no_fillers": "Excellent! No filler words detected.",
        },
    },
}
