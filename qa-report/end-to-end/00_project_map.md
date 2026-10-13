# End-to-End System & Architecture Map

**Tanggal Mapping**: 13 Oktober 2026  
**Auditor**: Senior End-to-End QA Engineer

---

## 1. Topologi Arsitektur End-to-End

```text
[Browser User]
      │
      ▼ (HTTPS / Static Assets)
[Next.js Quantitative Terminal (Vercel)]
      │
      ▼ (JSON REST over HTTPS /predict)
[FastAPI Gateway (Hugging Face Spaces - Port 7860 / Docker)]
      │
      ├──> CORSMiddleware & Pydantic Request DTO Validation
      │
      ├──> Observability Probes (/health & /health/ready)
      │
      └──> SentimentService Layer (asyncio.to_thread)
                │
                ├──> Tokenizer & Transformer Forward Pass (torch.no_grad)
                │
                └──> Normalization (BULLISH, BEARISH, NEUTRAL)
```

## 2. Peta Endpoint & Komponen Kritis

| Komponen | File Implementasi | Tanggung Jawab Kritis |
|---|---|---|
| **Web UI** | `frontend/src/app/page.tsx` | Input headline, polling health check, visualisasi gauge & sinyal |
| **Gauges & Badges** | `frontend/src/components/*` | Menampilkan persentase probabilitas, status pulse, preset buttons |
| **App Entry & Lifecycle**| `src/app.py` | FastAPI setup, lifespan initialization, CORS setup |
| **API Endpoints** | `src/api/routes.py` | `/`, `/health`, `/health/ready`, `/predict` |
| **Data Contracts** | `src/api/schemas.py` | Payload schema validation & sanitasi respon |
| **Model Service** | `src/services/sentiment_service.py` | Dynamic model loading, inference isolation, fallback handling |
| **CI/CD** | `.github/workflows/ci.yml` | Linting, automated testing gate, docker verification |
