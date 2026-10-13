# Style Convention & Language Baseline Detection

**Tanggal Audit**: 13 Oktober 2026  
**Auditor**: Senior Code Readability & Language Consistency Reviewer  
**Target Codebase**: `quant-market-sentiment-engine` (`src/`, `frontend/`, `scripts/`, `tests/`)

---

## 1. Bahasa Baku Project

- **Source Code (Python & TypeScript)**: **100% Bahasa Inggris (EN)**
  - Function, variable, class, constant naming: Bahasa Inggris.
  - Inline comments dan docstrings teknis: Bahasa Inggris.
  - UI labels, error messages, and API response strings: Bahasa Inggris.
- **Dokumentasi Publik**:
  - `README.md`, `MODEL_CARD.md`, `CHANGELOG.md`, `CONTRIBUTING.md`: **Bahasa Inggris (EN)** (standar publik GitHub / Hugging Face).
- **Dokumentasi Internal / Audit Historis**:
  - `docs/PRODUCTION-READINESS-ASSESSMENT.md`: **Bahasa Indonesia (ID)** (Laporan audit manajemen lokal).
  - `docs/Prompt/`: **Bahasa Indonesia (ID)** (Instruksi panduan prompt tim).

## 2. Style Convention Codebase

| Aspek | Konvensi Python (`src/`, `tests/`, `scripts/`) | Konvensi TypeScript (`frontend/src/`) |
|---|---|---|
| **Naming Variables & Functions** | `snake_case` (contoh: `get_sentiment_service`, `latency_ms`) | `camelCase` (contoh: `handleAnalyze`, `apiOnline`) |
| **Naming Classes & Components** | `PascalCase` (contoh: `SentimentService`, `PredictRequest`) | `PascalCase` (contoh: `SentimentGauge`, `SignalBadge`) |
| **Constants** | `UPPER_SNAKE_CASE` (contoh: `MAX_SEQ_LENGTH`) | `UPPER_SNAKE_CASE` (contoh: `PRESETS`) |
| **Indentation** | 4 spasi (PEP 8 standard) | 2 spasi |
| **Max Line Length** | 120 karakter (`.flake8` enforced) | Standar Prettier / 100 karakter |
| **Docstring / Comments** | Google/PEP 257 Python docstrings | JSDoc / TS inline types |

## 3. Istilah Teknis yang Tetap dalam Bahasa Aslinya
- Terminus finansial & quant: *Bullish*, *Bearish*, *Neutral*, *Alpha*, *Confidence*, *Latency*, *Consensus*, *Macro-F1*.
- Terminus infrastruktur & software: *Endpoint*, *Middleware*, *Lifespan*, *Probe*, *Container*, *Docker*, *FastAPI*, *Transformers*.
