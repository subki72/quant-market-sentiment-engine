"""
Quant Market Sentiment Engine - FastAPI Application Entry Point.
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.api.routes import router as api_router
from src.config import get_settings
from src.logger import get_logger, setup_logging
from src.services.sentiment_service import get_sentiment_service

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manages application lifecycle: logging setup, model loading, and cleanup."""
    setup_logging()
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} v{settings.app_version} [{settings.app_env}]")

    # Initialize and load model weights on startup
    service = get_sentiment_service()
    service.load_model()

    if service.is_ready:
        logger.info(f"Service startup complete. Active model: {service.active_source}")
    else:
        logger.warning(f"Service started in degraded state. Model not ready: {service.load_error}")

    yield

    logger.info("Shutting down Quant Market Sentiment Engine gracefully.")


def create_app() -> FastAPI:
    """Factory function to configure and return FastAPI instance."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        description=(
            "Production-Grade Quant Market Sentiment Engine. "
            "Fine-tuned Transformer NLP pipeline detecting Bullish, Bearish, and Neutral "
            "signals from financial news, tweets, and earnings transcripts."
        ),
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # Configure CORS middleware
    origins = settings.get_cors_origins()
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routes
    application.include_router(api_router)

    return application


app = create_app()

if __name__ == "__main__":
    current_settings = get_settings()
    uvicorn.run(
        "src.app:app",
        host=current_settings.host,
        port=current_settings.port,
        reload=(current_settings.app_env == "development")
    )
