"""
Unit tests for SentimentService, signal normalization, and configuration.
"""
import pytest
from src.config import Settings
from src.services.sentiment_service import SentimentService, normalize_signal


def test_normalize_signal():
    """Tests various input formats map cleanly to standard uppercase signals."""
    assert normalize_signal("positive") == "BULLISH"
    assert normalize_signal("POSITIVE") == "BULLISH"
    assert normalize_signal("negative") == "BEARISH"
    assert normalize_signal("NEGATIVE") == "BEARISH"
    assert normalize_signal("neutral") == "NEUTRAL"
    assert normalize_signal("bullish") == "BULLISH"
    assert normalize_signal("bearish") == "BEARISH"
    assert normalize_signal("LABEL_0") == "BEARISH"
    assert normalize_signal("LABEL_1") == "BULLISH"
    assert normalize_signal("LABEL_2") == "NEUTRAL"


def test_sentiment_service_unready_raises():
    """Tests that calling predict on an uninitialized service raises RuntimeError."""
    service = SentimentService()
    assert service.is_ready is False
    with pytest.raises(RuntimeError) as exc_info:
        service._predict_sync("Some market headline")
    assert "not initialized" in str(exc_info.value).lower()


def test_settings_cors_origins_parsing():
    """Tests CORS origin parsing from string."""
    # Wildcard
    s1 = Settings(cors_origins="*")
    assert s1.get_cors_origins() == ["*"]

    # Comma-separated
    s2 = Settings(cors_origins="https://app.vercel.app, http://localhost:3000")
    assert s2.get_cors_origins() == ["https://app.vercel.app", "http://localhost:3000"]

    # Secure default
    s3 = Settings()
    assert "http://localhost:3000" in s3.get_cors_origins()
    assert "http://127.0.0.1:3000" in s3.get_cors_origins()


def test_settings_api_key_default():
    """Tests default API Key configuration is None/open demo mode."""
    s = Settings()
    assert s.api_key is None
    assert s.rate_limit_per_minute == 60
