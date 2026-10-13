"""
Application configuration management using Pydantic Settings.
"""
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings loaded from environment variables and .env file."""

    app_name: str = "Quant Market Sentiment Engine"
    app_env: str = "development"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    # Model configuration
    model_path: str = "./models"
    hf_model_repo: str = "assubki/fin-sentiment-distilbert"
    hf_fallback_model: str = "ProsusAI/finbert"
    max_seq_length: int = 64

    # Security, CORS, and Throttling
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    api_key: Optional[str] = None
    rate_limit_per_minute: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    def get_cors_origins(self) -> List[str]:
        """Parses comma-separated CORS origins into a list of cleaned URLs."""
        if not self.cors_origins or self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Returns cached settings instance."""
    return Settings()
