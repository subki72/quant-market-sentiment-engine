"""Unit tests for Pydantic request and response DTO schemas."""
import pytest
from pydantic import ValidationError
from src.api.schemas import HealthResponse, PredictRequest, PredictResponse, RootResponse


def test_predict_request_valid() -> None:
    """Accepts normal financial headline within length bounds."""
    req = PredictRequest(text="NVIDIA beats Q4 revenue expectations by 12%.")
    assert "NVIDIA" in req.text


def test_predict_request_rejects_empty_and_oversized() -> None:
    """Rejects empty strings and payloads over 2000 characters."""
    with pytest.raises(ValidationError):
        PredictRequest(text="")

    with pytest.raises(ValidationError):
        PredictRequest(text="x" * 2001)


def test_predict_response_fills_missing_classes() -> None:
    """Ensures probability validator backfills omitted sentiment classes with 0.0."""
    resp = PredictResponse(
        text="Earnings surge",
        signal="BULLISH",
        confidence=95.0,
        probabilities={"BULLISH": 95.0},
        latency_ms=14.2,
    )
    assert resp.probabilities["BULLISH"] == 95.0
    assert resp.probabilities["BEARISH"] == 0.0
    assert resp.probabilities["NEUTRAL"] == 0.0


def test_health_and_root_response_schemas() -> None:
    """Verifies HealthResponse and RootResponse serialize expected fields."""
    health = HealthResponse(
        status="healthy",
        model_loaded=True,
        model_source="./models",
        version="1.0.0",
    )
    assert health.model_loaded is True

    root = RootResponse(
        name="Quant Market Sentiment Engine",
        version="1.0.0",
        status="online",
        docs_url="/docs",
    )
    assert root.docs_url == "/docs"
