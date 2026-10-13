# Changelog

All notable changes to the Quant Market Sentiment Engine project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-13

### Added
- **Production Architecture**: Refactored monolithic API into modular Service Layer (`src/services/sentiment_service.py`), centralized Pydantic configuration (`src/config.py`), and dedicated DTO schemas (`src/api/schemas.py`).
- **Async Thread Execution**: Non-blocking Transformer inference via `asyncio.to_thread` preventing CPU event-loop starvation.
- **Model Distribution Automation**: Scripts `scripts/download_model.py` and `scripts/upload_to_hf.py` for automated syncing with Hugging Face Model Hub (`assubki/fin-sentiment-distilbert`).
- **Observability Probes**: Standardized `/health` and `/health/ready` liveness and readiness endpoints.
- **Structured Logging**: Replaced raw `print()` statements with Python standard `logging` configured with timestamps, log levels, and module tagging.
- **Automated Testing Suite**: Full Pytest unit and integration test suite with mock inference engine, yielding >70% test coverage.
- **Continuous Integration (CI)**: GitHub Actions workflow (`.github/workflows/ci.yml`) enforcing Flake8 static linting, pytest test execution, and Docker build verification.
- **Containerization**: Multi-stage, CPU-optimized `Dockerfile` with non-root user UID 1000 compatibility for Hugging Face Spaces Docker SDK, plus `docker-compose.yml`.
- **Model Card**: Formatted `MODEL_CARD.md` detailing dataset origin, accuracy (86.89%), macro-F1 (82.84%), and ethical boundaries.
- **Next.js Web Frontend**: High-performance dark-themed FinTech Quantitative Terminal replacing legacy Streamlit interface.

### Changed
- Migrated model loading from unhandled global scope to FastAPI `lifespan` context manager.
- Configured configurable `CORSMiddleware` supporting Next.js web clients on Vercel.
- Standardized error handling to prevent internal stack trace leakage over HTTP.

### Removed
- Removed legacy, single-threaded Streamlit prototype (`src/dashboard.py`).
