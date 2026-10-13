"""
Pydantic schemas for API request and response data models.
"""
from typing import Dict, Literal
from pydantic import BaseModel, Field, field_validator

SignalType = Literal["BULLISH", "BEARISH", "NEUTRAL"]


class PredictRequest(BaseModel):
    """Payload for text sentiment analysis prediction."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Financial news headline, tweet, or market commentary.",
        examples=["Tesla reports record-breaking Q4 vehicle deliveries, beating analyst estimates."]
    )


class PredictResponse(BaseModel):
    """Response payload containing sentiment signal and confidence."""
    text: str = Field(..., description="Original evaluated financial text.")
    signal: SignalType = Field(..., description="Trading signal: BULLISH, BEARISH, or NEUTRAL.")
    confidence: float = Field(..., ge=0.0, le=100.0, description="Model confidence percentage (0.0 - 100.0).")
    probabilities: Dict[SignalType, float] = Field(
        default_factory=dict,
        description="Probability distribution across all sentiment classes (sums to ~100.0%)."
    )
    latency_ms: float = Field(..., ge=0.0, description="Inference latency in milliseconds.")

    @field_validator("probabilities")
    @classmethod
    def validate_probabilities(cls, v: Dict[SignalType, float]) -> Dict[SignalType, float]:
        """Ensures all standard trading sentiment classes are present and valid numbers."""
        required_classes = {"BULLISH", "BEARISH", "NEUTRAL"}
        for rc in required_classes:
            if rc not in v:
                v[rc] = 0.0
            if not isinstance(v[rc], (int, float)):
                v[rc] = float(v[rc])
        return v


class HealthResponse(BaseModel):
    """Health check and model readiness status response."""
    status: str = Field(..., description="Overall service status (healthy/degraded).")
    model_loaded: bool = Field(..., description="Whether the NLP model is loaded and ready.")
    model_source: str = Field(..., description="Active model path or HuggingFace identifier.")
    version: str = Field(..., description="Service version.")


class RootResponse(BaseModel):
    """Service metadata response."""
    name: str
    version: str
    status: str
    docs_url: str
