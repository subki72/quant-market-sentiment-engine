# Stack & Technology Baseline Detection

**Tanggal Audit**: 13 Oktober 2026  
**Auditor**: Senior Code Quality Reviewer

---

## 1. Stack Backend
- **Bahasa**: Python 3.10+
- **Framework API**: FastAPI 0.115+ / Uvicorn (ASGI)
- **Engine Komputasi ML**: PyTorch 2.2+ (CPU), Hugging Face Transformers 4.44+
- **Validasi Schema**: Pydantic v2, Pydantic-Settings
- **Testing**: Pytest 8.3+, Pytest-Asyncio, Pytest-Cov, HTTPX

## 2. Stack Frontend
- **Runtime**: Node.js 20+
- **Framework**: Next.js 14.2+ (App Router, Server & Client Components)
- **Bahasa**: TypeScript 5.4+ (Strict Mode)
- **Styling**: Vanilla CSS & CSS Variables (Dark Terminal Glassmorphism)

## 3. Infrastruktur & Container
- **Container**: Docker Multi-Stage Build (Python slim base)
- **Orkestrasi**: Docker Compose
- **Target Hosting**: Hugging Face Spaces (Docker SDK, Port 7860) & Vercel
- **CI/CD**: GitHub Actions (Flake8, Pytest Coverage, Docker Build)
