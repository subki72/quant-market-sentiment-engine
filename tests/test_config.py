"""Unit tests for application configuration settings."""
from src.config import Settings, get_settings


def test_default_settings_values() -> None:
    """Verifies sane defaults for Quant Market Sentiment Engine settings."""
    cfg = Settings()
    assert cfg.app_name == "Quant Market Sentiment Engine"
    assert cfg.max_seq_length == 64
    assert cfg.rate_limit_per_minute == 60
    assert cfg.port == 8000


def test_cors_origin_parsing_multiple() -> None:
    """Verifies comma-separated CORS origins are parsed and stripped cleanly."""
    cfg = Settings(cors_origins="https://a.example.com, https://b.example.com , ")
    assert cfg.get_cors_origins() == ["https://a.example.com", "https://b.example.com"]


def test_cors_origin_parsing_wildcard() -> None:
    """Verifies wildcard and empty CORS values fall back to ['*']."""
    assert Settings(cors_origins="*").get_cors_origins() == ["*"]
    assert Settings(cors_origins="").get_cors_origins() == ["*"]


def test_get_settings_returns_cached_singleton() -> None:
    """Verifies get_settings caches the configuration instance."""
    first = get_settings()
    second = get_settings()
    assert first is second
