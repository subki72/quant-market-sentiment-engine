"""
Pytest configuration, fixtures, and mocked inference dependencies.
"""
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.app import app
from src.api.routes import reset_rate_limiter
from src.services.sentiment_service import SentimentService, get_sentiment_service


class DummyModelConfig:
    def __init__(self):
        self.id2label = {0: "BEARISH", 1: "BULLISH", 2: "NEUTRAL"}


class MockSentimentService(SentimentService):
    """Mock sentiment service that mimics transformer inference for test execution."""

    def __init__(self):
        super().__init__()
        self.is_ready = True
        self.active_source = "mock:distilbert-test"
        self.load_error = None

    def _predict_sync(self, text: str) -> dict:
        """Deterministic test inference."""
        lower_text = text.lower()
        if "bullish" in lower_text or "soars" in lower_text or "beats" in lower_text or "record" in lower_text:
            signal = "BULLISH"
            confidence = 94.50
            probabilities = {"BULLISH": 94.50, "BEARISH": 3.20, "NEUTRAL": 2.30}
        elif "bearish" in lower_text or "falls" in lower_text or "crash" in lower_text or "sues" in lower_text:
            signal = "BEARISH"
            confidence = 91.20
            probabilities = {"BEARISH": 91.20, "BULLISH": 4.10, "NEUTRAL": 4.70}
        else:
            signal = "NEUTRAL"
            confidence = 88.00
            probabilities = {"NEUTRAL": 88.00, "BULLISH": 6.00, "BEARISH": 6.00}

        return {
            "text": text,
            "signal": signal,
            "confidence": confidence,
            "probabilities": probabilities,
            "latency_ms": 12.34
        }


@pytest.fixture
def mock_service() -> MockSentimentService:
    """Fixture providing a ready mock sentiment service."""
    return MockSentimentService()


@pytest_asyncio.fixture
async def async_client(mock_service: MockSentimentService) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client with mock service dependency injected."""
    reset_rate_limiter()
    app.dependency_overrides[get_sentiment_service] = lambda: mock_service
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.clear()
    reset_rate_limiter()


@pytest_asyncio.fixture
async def unready_client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP test client where the service is in an unready/degraded state."""
    reset_rate_limiter()
    unready_service = SentimentService()
    unready_service.is_ready = False
    unready_service.active_source = "none"
    unready_service.load_error = "Model weights failed to load."

    app.dependency_overrides[get_sentiment_service] = lambda: unready_service
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.clear()
    reset_rate_limiter()
