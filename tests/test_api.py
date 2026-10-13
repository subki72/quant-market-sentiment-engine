"""
Comprehensive integration and endpoint test suite for FastAPI routes.
"""
import pytest
from httpx import ASGITransport, AsyncClient
from src.app import app
from src.config import Settings, get_settings
from src.services.sentiment_service import get_sentiment_service
from tests.conftest import MockSentimentService


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """Verifies the root endpoint returns 200 OK with proper metadata."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert data["status"] == "running"
    assert data["docs_url"] == "/docs"


@pytest.mark.asyncio
async def test_health_check_healthy(async_client: AsyncClient):
    """Verifies /health probe reports healthy status when model is loaded."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "mock" in data["model_source"]


@pytest.mark.asyncio
async def test_readiness_probe_ready(async_client: AsyncClient):
    """Verifies /health/ready returns 200 when service is ready."""
    response = await async_client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


@pytest.mark.asyncio
async def test_readiness_probe_unready(unready_client: AsyncClient):
    """Verifies /health/ready returns 503 when service model is not loaded."""
    response = await unready_client.get("/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_predict_bullish_signal(async_client: AsyncClient):
    """Verifies /predict detects bullish market signal."""
    payload = {"text": "Tesla record revenue beats Wall Street quarterly estimates."}
    response = await async_client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["signal"] == "BULLISH"
    assert data["confidence"] > 80.0
    assert "probabilities" in data
    assert "latency_ms" in data
    assert data["latency_ms"] > 0


@pytest.mark.asyncio
async def test_predict_bearish_signal(async_client: AsyncClient):
    """Verifies /predict detects bearish market signal."""
    payload = {"text": "Company revenue falls drastically amid regulatory lawsuit and crash."}
    response = await async_client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["signal"] == "BEARISH"
    assert data["confidence"] > 80.0


@pytest.mark.asyncio
async def test_predict_neutral_signal(async_client: AsyncClient):
    """Verifies /predict detects neutral statement."""
    payload = {"text": "The board announced the scheduling date for the next annual meeting."}
    response = await async_client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["signal"] == "NEUTRAL"


@pytest.mark.asyncio
async def test_predict_empty_text_error(async_client: AsyncClient):
    """Verifies /predict rejects empty string payload with HTTP 422 or 400."""
    payload = {"text": ""}
    response = await async_client.post("/predict", json=payload)
    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_predict_whitespace_only_error(async_client: AsyncClient):
    """Verifies /predict rejects whitespace-only string with HTTP 400."""
    payload = {"text": "     "}
    response = await async_client.post("/predict", json=payload)
    assert response.status_code == 400
    assert "whitespace" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_predict_when_model_unready(unready_client: AsyncClient):
    """Verifies /predict returns 503 instead of crashing when model is not ready."""
    payload = {"text": "Federal Reserve leaves interest rates unchanged."}
    response = await unready_client.post("/predict", json=payload)
    assert response.status_code == 503
    assert "not ready" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_predict_probabilities_sum_100(async_client: AsyncClient):
    """Verifies probabilities contains standard keys and sums to 100.0%."""
    payload = {"text": "Federal Reserve interest rate cuts boost banking profits."}
    response = await async_client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    probs = data["probabilities"]
    assert "BULLISH" in probs
    assert "BEARISH" in probs
    assert "NEUTRAL" in probs
    total = round(sum(probs.values()), 2)
    assert total == 100.0


@pytest.mark.asyncio
async def test_optional_api_key_protection(mock_service: MockSentimentService):
    """Verifies API Key validation when configured in settings."""
    test_settings = Settings(api_key="secret-quant-key-123")
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_sentiment_service] = lambda: mock_service

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {"text": "Apple records strong Mac sales."}

        # 1. Missing key -> 401
        res_no_key = await client.post("/predict", json=payload)
        assert res_no_key.status_code == 401

        # 2. Invalid key -> 401
        res_bad_key = await client.post("/predict", json=payload, headers={"X-API-Key": "wrong-key"})
        assert res_bad_key.status_code == 401

        # 3. Valid X-API-Key -> 200
        res_valid_header = await client.post(
            "/predict",
            json=payload,
            headers={"X-API-Key": "secret-quant-key-123"}
        )
        assert res_valid_header.status_code == 200

        # 4. Valid Bearer Token -> 200
        res_valid_bearer = await client.post(
            "/predict",
            json=payload,
            headers={"Authorization": "Bearer secret-quant-key-123"}
        )
        assert res_valid_bearer.status_code == 200

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_rate_limiting_throttles(mock_service: MockSentimentService):
    """Verifies that exceeding the configured rate limit triggers HTTP 429."""
    from src.api.routes import reset_rate_limiter
    reset_rate_limiter()
    tight_settings = Settings(rate_limit_per_minute=2)
    app.dependency_overrides[get_settings] = lambda: tight_settings
    app.dependency_overrides[get_sentiment_service] = lambda: mock_service

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {"text": "Market rally continues on technology optimism."}

        # Request 1 -> 200
        r1 = await client.post("/predict", json=payload)
        assert r1.status_code == 200

        # Request 2 -> 200
        r2 = await client.post("/predict", json=payload)
        assert r2.status_code == 200

        # Request 3 -> 429 Throttled
        r3 = await client.post("/predict", json=payload)
        assert r3.status_code == 429
        assert "rate limit exceeded" in r3.json()["detail"].lower()

    app.dependency_overrides.clear()
