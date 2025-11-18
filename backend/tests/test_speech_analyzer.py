import pytest
from app.services.speech_analyzer import SpeechAnalyzer


def test_speech_analyzer_categories():
    """Test that all categories are properly defined"""
    analyzer = SpeechAnalyzer()
    categories = analyzer.get_categories()
    
    assert "presentation" in categories
    assert "pitch" in categories
    assert "conversation" in categories
    assert "other" in categories
    
    # Check presentation category
    presentation = categories["presentation"]
    assert presentation["min_ppm"] == 140
    assert presentation["max_ppm"] == 160
    assert "name" in presentation
    assert "description" in presentation


def test_feedback_generation():
    """Test feedback generation logic"""
    analyzer = SpeechAnalyzer()
    cat_info = analyzer.CATEGORIES["presentation"]
    
    # Test within range
    feedback = analyzer._generate_feedback(150, cat_info, True)
    assert "Excelente" in feedback or "ideal" in feedback.lower()
    
    # Test too slow
    feedback = analyzer._generate_feedback(120, cat_info, False)
    assert "devagar" in feedback.lower() or "acelerar" in feedback.lower()
    
    # Test too fast
    feedback = analyzer._generate_feedback(180, cat_info, False)
    assert "rápido" in feedback.lower() or "diminuir" in feedback.lower()


def test_category_ranges():
    """Test that all category ranges are valid"""
    analyzer = SpeechAnalyzer()
    
    for cat_id, cat_info in analyzer.CATEGORIES.items():
        assert cat_info["min_ppm"] < cat_info["max_ppm"], f"{cat_id} has invalid range"
        assert cat_info["min_ppm"] > 0, f"{cat_id} has negative min PPM"
        assert cat_info["max_ppm"] < 300, f"{cat_id} has unrealistic max PPM"
