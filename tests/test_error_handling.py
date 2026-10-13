"""
Tests covering exception paths, unexpected failures, and logging initialization.
"""
import pytest
from httpx import ASGITransport, AsyncClient

from src.logger import setup_logging, get_logger
from src.app import app
from src.services.sentiment_service import get_sentiment_service, SentimentService


def test_setup_logging():
    """Verifies setup_logging configures root logger and retrieves named logger."""
    setup_logging()
    logger = get_logger("test_module")
    assert logger.name == "test_module"


@pytest.mark.asyncio
async def test_predict_unexpected_exception_returns_500():
    """Verifies that an unhandled exception inside service.predict is caught and returns 500 without leaking details."""
    broken_service = SentimentService()
    broken_service.is_ready = True
    broken_service.active_source = "mock:broken"

    # Patch predict to raise an unhandled exception
    async def broken_predict(text: str):
        raise ValueError("Simulated unexpected computation crash")

    broken_service.predict = broken_predict

    from src.api.routes import reset_rate_limiter
    reset_rate_limiter()
    app.dependency_overrides[get_sentiment_service] = lambda: broken_service
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/predict", json={"text": "Apple earnings beat"})
        assert response.status_code == 500
        data = response.json()
        assert "internal error occurred" in data["detail"].lower()
        # Verify stack trace / internal exception is NOT leaked
        assert "Simulated unexpected computation crash" not in data["detail"]
    app.dependency_overrides.clear()
