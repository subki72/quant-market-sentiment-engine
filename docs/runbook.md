# Operational Runbook — Quant Market Sentiment Engine

## 1. Service Overview
- **Backend**: FastAPI + DistilBERT (`src/app.py`, port `8000` / HF Spaces `7860`).
- **Frontend**: Next.js Quantitative Terminal (`frontend/`, port `3000`).
- **Health Probes**:
  - Liveness: `GET /health`
  - Readiness: `GET /health/ready` (returns `503` while weights are loading)

## 2. Standard Operations
- **Local Startup**: `make run` or `docker compose up --build`
- **Model Refresh**: `python scripts/download_model.py --repo-id assubki/fin-sentiment-distilbert`
- **Verification**: `make test` and `make lint`

## 3. Incident Response
| Symptom | Cause | Action |
|---|---|---|
| `503 Service Unavailable` on `/predict` | Model weights missing or Hugging Face Hub unreachable | Check container logs, verify `MODEL_PATH` mount or `HF_FALLBACK_MODEL=ProsusAI/finbert`. |
| `401 Unauthorized` from frontend | `API_KEY` mismatch between backend env and client header | Rotate `API_KEY` across Vercel and HF Spaces secrets simultaneously. |
| Elevated P95 latency (>200 ms) | CPU contention on worker threads | Scale container replicas or check concurrent request rate limit (`RATE_LIMIT_PER_MINUTE`). |

## 4. Rollback
Revert deployment to tag `v1.0.0` (`git checkout v1.0.0`) and rebuild container image via `make docker-build`.
