"""
API route definitions for Quant Market Sentiment Engine.
"""
import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from src.api.schemas import HealthResponse, PredictRequest, PredictResponse, RootResponse
from src.config import Settings, get_settings
from src.logger import get_logger
from src.services.sentiment_service import SentimentService, get_sentiment_service

logger = get_logger(__name__)
router = APIRouter()

# In-memory IP request history for sliding-window rate limiting
_ip_request_history: Dict[str, List[float]] = defaultdict(list)


def reset_rate_limiter() -> None:
    """Utility to clear IP rate limit history, primarily for test suites."""
    _ip_request_history.clear()


def check_rate_limit(request: Request, settings: Settings = Depends(get_settings)) -> None:
    """Sliding-window IP rate limiter preventing request flooding."""
    limit = settings.rate_limit_per_minute
    if limit <= 0:
        return

    now = time.time()
    client_ip = request.client.host if request.client else "unknown"

    # Filter timestamps older than 60 seconds
    timestamps = [t for t in _ip_request_history[client_ip] if now - t < 60.0]
    if len(timestamps) >= limit:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded ({limit} requests/minute). Please throttle your requests."
        )

    timestamps.append(now)
    _ip_request_history[client_ip] = timestamps


def verify_optional_api_key(
    settings: Settings = Depends(get_settings),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> None:
    """
    Enforces API Key authentication if API_KEY is set in settings.
    If API_KEY is empty/None, requests are permitted publicly (Demo mode).
    """
    if not settings.api_key or not settings.api_key.strip():
        return

    expected_key = settings.api_key.strip()

    # Check X-API-Key header
    if x_api_key and x_api_key.strip() == expected_key:
        return

    # Check Authorization: Bearer <key> header
    if authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1] == expected_key:
            return

    logger.warning("Unauthorized inference attempt: invalid or missing API Key.")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API Key. Provide 'X-API-Key' or 'Authorization: Bearer <key>'."
    )


@router.get("/", response_model=RootResponse, tags=["General"])
async def root(settings: Settings = Depends(get_settings)) -> RootResponse:
    """Service landing endpoint with metadata."""
    return RootResponse(
        name=settings.app_name,
        version=settings.app_version,
        status="running",
        docs_url="/docs"
    )


@router.get("/health", response_model=HealthResponse, tags=["Observability"])
async def health_check(
    settings: Settings = Depends(get_settings),
    service: SentimentService = Depends(get_sentiment_service)
) -> HealthResponse:
    """Liveness probe to verify the application process is operational."""
    return HealthResponse(
        status="healthy" if service.is_ready else "degraded",
        model_loaded=service.is_ready,
        model_source=service.active_source,
        version=settings.app_version
    )


@router.get("/health/ready", tags=["Observability"])
async def readiness_probe(
    service: SentimentService = Depends(get_sentiment_service)
):
    """Readiness probe used by container orchestrators to route traffic."""
    if not service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unready",
                "error": service.load_error or "Model weights are still loading."
            }
        )
    return {"status": "ready", "source": service.active_source}


@router.post(
    "/predict",
    response_model=PredictResponse,
    dependencies=[Depends(check_rate_limit), Depends(verify_optional_api_key)],
    tags=["Inference"]
)
async def predict_sentiment(
    request: PredictRequest,
    service: SentimentService = Depends(get_sentiment_service)
) -> PredictResponse:
    """Analyzes market sentiment from input financial text and returns a trading signal."""
    cleaned_text = request.text.strip()
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text payload cannot be empty or whitespace only."
        )

    if not service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sentiment analysis model is not ready. Please try again in a few moments."
        )

    try:
        result = await service.predict(cleaned_text)
        return PredictResponse(**result)
    except Exception as exc:
        logger.error(f"Inference error processing text: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during sentiment classification."
        )
