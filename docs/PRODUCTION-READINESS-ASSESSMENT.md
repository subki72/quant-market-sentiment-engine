# Production-Readiness Assessment Report

> [!NOTE]
> Dokumen laporan ini disusun dalam Bahasa Indonesia khusus untuk kebutuhan audit internal dan evaluasi teknis tim pengembang. Dokumentasi publik repositori (`README.md`, `MODEL_CARD.md`, `CONTRIBUTING.md`) menggunakan Bahasa Inggris standar internasional.

**Project**: Quant Market Sentiment Engine (Financial Market Sentiment Analysis Engine)  
**Repository**: https://github.com/subki72/quant-market-sentiment-engine  
**Tanggal Assessment**: 13 Oktober 2026  
**Dinilai Oleh**: AI Agent (Technical Program Manager + DevOps Architect)  
**Scope Assessment**: Snapshot codebase branch `main` (commit `e209ef6`), 2 file source Python, 1 Jupyter Notebook training, README, .gitignore

---

## Executive Summary

Project ini adalah sebuah **Financial Market Sentiment Analysis Engine** berbasis DistilBERT yang terdiri dari sebuah FastAPI backend (`src/main.py`, 63 baris) dan Streamlit frontend (`src/dashboard.py`, 44 baris). README-nya mengklaim project ini "production-ready" dan memiliki "Production-Ready API", namun setelah audit menyeluruh, **temuan sebenarnya jauh dari klaim tersebut**.

**Status saat ini**: Codebase merupakan **proof-of-concept (PoC) / demo lokal** yang berfungsi sebagai demonstrasi kemampuan ML, namun belum memenuhi standar production — bahkan untuk project portfolio sekalipun. Kode berjalan di mesin lokal developer dengan model yang tidak di-commit ke repository (sehingga **tidak bisa dijalankan oleh siapapun yang clone dari GitHub tanpa langkah manual tambahan yang tidak terdokumentasi**).

**Blocking issues utama** ada 5: (1) tidak ada satu pun test, (2) model artifact tidak bisa di-reproduce dari repo, (3) tidak ada `requirements.txt` di repo, (4) bug kritis di `main.py` — jika model gagal load, app tetap berjalan tapi crash saat endpoint dipanggil, (5) tidak ada CI/CD pipeline apapun.

**Estimasi waktu** untuk membawa project ini ke standar portfolio-grade production-ready: **2–3 minggu** untuk seorang developer solo.

**Top 3 rekomendasi**:
1. Tambahkan `requirements.txt`, fix bug model-load, buat minimal test — tanpa ini project tidak bisa dijalankan oleh reviewer
2. Buat `Dockerfile` + `docker-compose.yml` agar dapat di-run dengan satu perintah
3. Tambahkan GitHub Actions CI/CD minimal: lint + test otomatis setiap push

---

## 1. Current State Snapshot

### Project Overview

| Atribut | Detail |
|---|---|
| **Repository** | https://github.com/subki72/quant-market-sentiment-engine |
| **Tech Stack** | Python 3.10, PyTorch 2.14, HuggingFace Transformers 5.17, FastAPI 0.136, Streamlit 1.57 |
| **ML Model** | DistilBERT fine-tuned (`distilbert-base-uncased`) untuk 3-class sentiment (Bullish/Bearish/Neutral) |
| **Deployment Status** | Belum di-deploy ke mana pun. Hanya bisa jalan di local machine developer |
| **Team** | 1 orang (Assubki / subkisyafii@gmail.com) |
| **SLA** | N/A — portfolio project |
| **Commit Activity** | 2 commits, 1 author, terakhir: 26 Februari 2026 |
| **Branch Strategy** | `main` saja, tidak ada branch protection rules |

### High-Level Maturity Matrix

| Dimensi | Score (1-5) | Status | Key Issue |
|---|---|---|---|
| Code Quality | 2 | Weak | Pylint 6.92/10, tidak ada linter config, bug silent failure |
| Architecture | 2 | Flat | Semua logic di 1 file, global state, hardcoded config |
| Testing | 1 | Absent | Nol test file, 0% coverage |
| Security | 2 | At-Risk | No auth, no rate limit, no CORS, requests tanpa timeout |
| Observability | 1 | Missing | Hanya `print()`, tidak ada logging, metrics, atau alerting |
| Deployment | 1 | Manual | Tidak ada CI/CD, Dockerfile, atau `requirements.txt` |
| Operations | 1 | Risky | Tidak ada runbook, health check, model tidak bisa di-reproduce |
| Documentation | 2 | Partial | README ada tapi memiliki bug dan missing info kritis |

---

## 2. Detailed Findings Per Dimensi

### 2.1 Code Quality & Maintainability

**Score: 2/5**

Pylint memberikan rating **6.92/10** — di bawah threshold standard industri (umumnya ≥8.0). Flake8 menemukan **19 issue** dari 107 baris total kode.

**Masalah konkret yang ditemukan**:

| Issue | File | Baris | Severity |
|---|---|---|---|
| Trailing whitespace masif (10 occurrences) | `main.py`, `dashboard.py` | Multiple | Low |
| Missing final newline | `main.py`, `dashboard.py` | EOF | Low |
| `except Exception` terlalu broad tanpa re-raise proper | `main.py` | L19, L62 | Medium |
| `requests.post()` tanpa timeout argument | `dashboard.py` | L18 | **High** — UI bisa hang |
| Class definitions tanpa blank lines sesuai PEP8 | `main.py` | L22, L25, L35 | Low |
| Tidak ada linter config | Tidak ada `pyproject.toml` / `.flake8` | — | Medium |
| Tidak ada code formatter | — | — | Medium |
| Tidak ada type annotations | `main.py` L32, L36 | — | Low |

**Bug Kritis (CRITICAL)**:

```python
# src/main.py, baris 15-20 — CRITICAL BUG
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
except Exception as e:
    print(f"Failed to load model: {e}")  # Bug: app tetap jalan, model = undefined
```

Jika `models/` folder tidak ada (situasi normal setelah fresh clone), `tokenizer` dan `model` **tidak pernah di-assign**. Aplikasi tetap berjalan tanpa error — tapi setiap call ke `/predict` akan crash dengan `NameError: name 'tokenizer' is not defined`. Ini adalah **silent failure** yang sangat sulit di-debug.

**Top Issues**:
- Bug kritis: Model load failure = silent crash on every request
- `requests.post()` tanpa timeout: dashboard bisa freeze permanent
- Broad exception swallowing di startup menyembunyikan root cause

---

### 2.2 Architecture & Design

**Score: 2/5**

Arsitektur project sangat flat tanpa separation of concerns. Semua concern (config, ML inference, HTTP handling) digabung dalam satu file 63 baris.

**Struktur saat ini**:
```
src/
├── main.py          # API routes + business logic + ML inference + config — semua dicampur
└── dashboard.py     # UI + HTTP client — hardcoded URL
```

**Masalah konkret**:

| Issue | Detail | Impact |
|---|---|---|
| No config layer | `MODEL_PATH` dan `API_URL` hardcoded | Deploy ke environment berbeda = edit code manual |
| Global mutable state | `model` dan `tokenizer` sebagai global variable | Tidak thread-safe untuk concurrent request |
| No service layer | Inference logic langsung di endpoint handler | Tidak bisa unit test inference tanpa full FastAPI stack |
| Sync inference di async context | `predict_sentiment()` adalah sync function | Satu request lambat block semua request lain |
| No health check endpoint | Tidak ada `/health` atau `/ready` | Load balancer tidak bisa verifikasi app sehat |
| No ADR | Tidak ada Architecture Decision Records | Tidak ada audit trail keputusan desain |
| Tight coupling dashboard-backend | URL hardcoded `http://127.0.0.1:8000` | Tidak bisa ganti backend URL tanpa edit kode |

**Tech Debt Estimate**: Refactor ke arsitektur yang proper membutuhkan ~3-5 hari untuk developer yang familiar dengan stack ini.

---

### 2.3 Testing & Quality Assurance

**Score: 1/5** — Dimensi terlemah bersama Observability dan Operations

**Nol test file** ditemukan di seluruh repository. Meskipun `pytest`, `pytest-cov`, `pytest-asyncio`, `pytest-mock` sudah terinstall di environment — tidak ada satu pun test yang ditulis.

| Level Test | Status | Detail |
|---|---|---|
| Unit Test | Absent | Tidak ada satu pun |
| Integration Test | Absent | Tidak ada |
| E2E Test | Absent | Tidak ada |
| Test Automation (CI) | Absent | Tidak ada GitHub Actions |
| Manual QA Process | Ad-hoc | Tidak ada checklist terdokumentasi |

**Test pyramid yang diharapkan vs realita**:
```
Diharapkan:                    Realita:
    [E2E: 1-2 test]               [tidak ada]
  [Integration: 5-10 test]        [tidak ada]
[Unit: 20-30 test]                [tidak ada]
```

**Critical untested path**:
- Endpoint `/predict` dengan berbagai input (empty string, text sangat panjang, karakter khusus, unicode)
- Model load failure scenario
- Dashboard connection error handling

**Coverage**: 0% — tidak ada framework untuk mengukur.

---

### 2.4 Security Posture

**Score: 2/5**

| Kategori | Status | Detail |
|---|---|---|
| Authentication | Absent | API `/predict` terbuka tanpa auth apapun |
| Authorization | N/A | Tidak ada role/permission system |
| Input Validation | Partial | Pydantic menangkap type error, ada check empty string. NAMUN tidak ada max_length validation HTTP-level |
| Injection Risk | Low | Inference path tidak eksekusi input sebagai code |
| Secrets Management | Hardcoded non-sensitive | `MODEL_PATH` dan `API_URL` hardcoded — bukan credentials tapi tidak bisa dikonfigurasi |
| Dependency CVE | Unchecked | Tidak ada `requirements.txt`, tidak ada proses scan CVE |
| HTTPS | HTTP Only | API berjalan di `http://` tanpa TLS |
| CORS | Absent | Tidak ada `CORSMiddleware` |
| Rate Limiting | Absent | Endpoint bisa di-spam tanpa batas |
| Audit Logging | Absent | Tidak ada pencatatan request |
| Error Info Leakage | Risk | `detail=str(e)` di response bisa expose internal stack trace |

**OWASP Top 10 Assessment**:

| OWASP Category | Status |
|---|---|
| A01: Broken Access Control | API fully open |
| A02: Cryptographic Failures | No HTTPS |
| A03: Injection | Not applicable (ML inference) |
| A05: Security Misconfiguration | No CORS, no rate limit |
| A09: Security Logging & Monitoring | Tidak ada |

**Top 5 Security Gaps**:
1. No Authentication — API bisa diakses siapa pun
2. No Rate Limiting — potensi abuse/DoS
3. HTTP-only — data in transit tidak encrypted
4. No CVE scanning process
5. Error detail leakage via `str(e)` di response body

---

### 2.5 Observability & Monitoring

**Score: 1/5**

| Komponen | Status | Detail |
|---|---|---|
| Logging | `print()` only | Satu-satunya "logging" adalah `print(f"Failed to load model: {e}")`. Tidak ada Python `logging` module, tidak ada log level, tidak ada timestamp |
| Access Log | Absent | Request log tidak di-capture secara structured |
| Error Log | Absent | Error hanya ada di HTTP response, tidak tersimpan |
| Metrics | Absent | Tidak ada uptime, latency, error rate, atau prediction count monitoring |
| Dashboard/Monitoring | Absent | Tidak ada (Streamlit adalah UI end-user, bukan ops monitoring) |
| Alerting | Absent | Tidak ada alert rule atau notifikasi |
| Distributed Tracing | N/A | Single service |
| Model Performance Monitoring | Absent | Tidak ada tracking model drift |

**Konteks portfolio**: Absennya logging yang proper adalah red flag yang menunjukkan bahwa developer tidak memikirkan observability — salah satu skill kritis untuk ML engineering.

---

### 2.6 Deployment & Release Process

**Score: 1/5**

| Komponen | Status | Detail |
|---|---|---|
| Build Process | Manual | Tidak ada automated build |
| Dependency Lockfile | Absent | `requirements.txt` **tidak ada di repository** |
| CI/CD Pipeline | Absent | Tidak ada `.github/workflows/` |
| Containerization | Absent | Tidak ada Dockerfile atau docker-compose.yml |
| Deployment | Local only | Belum pernah di-deploy ke staging atau production |
| Rollback Process | N/A | Tidak relevan karena belum ada deployment |
| Configuration Drift | Risk | Tidak ada cara memastikan environment siapapun sama dengan developer |
| Model Artifact Distribution | Critical Gap | `models/` di-gitignore. Tidak ada instruksi cara mendapatkan model setelah clone |

**Bug di README** (ditemukan saat audit):
```markdown
# README.md baris 51 — URL format salah
pip install torch ... --index-url [https://download.pytorch.org/whl/cu121](https://...)
# Ini di-render sebagai clickable link, bukan plain URL untuk copy-paste
```

**Impact terbesar untuk portfolio**: Siapapun yang clone repo ini dari GitHub dan mengikuti README **tidak bisa menjalankan project ini** karena:
1. Tidak ada `requirements.txt` yang complete dan versioned
2. Model tidak ada (gitignored) tanpa cara reproduksinya selain training ulang (butuh GPU + berjam-jam)
3. `Run_Trading_Bot.bat` yang disebutkan di README juga di-gitignore

---

### 2.7 Operational Readiness & Recovery

**Score: 1/5**

| Komponen | Status | Detail |
|---|---|---|
| Runbook | Absent | Tidak ada dokumentasi start/stop/restart atau troubleshooting |
| Health Check | Absent | Tidak ada `/health` endpoint. `/` hanya return "API is running" tapi tidak cek apakah model loaded |
| Incident Response | Absent | Tidak ada process |
| Backup & Recovery | N/A | Tidak ada database |
| Scaling | Not designed | Global state tidak thread-safe. Sync inference. Single instance only |
| Graceful Shutdown | Absent | Tidak ada lifespan handler untuk cleanup |
| Bus Factor | 1 | Hanya 1 contributor. Tidak ada orang lain yang paham codebase |

**Specific scenario risk**:
- Jika model di-update (retrain), tidak ada process deploy model baru tanpa restart manual
- Sync inference + uvicorn single worker = satu request lambat block semua request lain

---

### 2.8 Documentation & Knowledge Management

**Score: 2/5**

| Dokumen | Status | Detail |
|---|---|---|
| README.md | Partial | Ada, tapi memiliki bug link, missing info kritis, referensi ke file yang di-gitignore |
| API Documentation | Auto-only | FastAPI auto-generate Swagger di `/docs` — hanya tersedia saat app running |
| Architecture Doc | Absent | Tidak ada diagram atau ADR |
| Training Documentation | Good | Notebook well-documented dengan markdown cells dan docstrings |
| Deployment Guide | Incomplete | Basic commands ada, tapi tidak ada troubleshooting atau common errors |
| Model Card | Absent | Tidak ada dokumentasi dataset, bias, limitation model |
| Contributing Guide | Absent | Tidak ada CONTRIBUTING.md |
| CHANGELOG | Absent | Tidak ada |
| Knowledge Concentration | Bus factor 1 | 100% pengetahuan ada di 1 orang |

**Hal yang baik**:
- Badge di README memberikan quick overview tech stack yang baik
- Model performance metrics (86.89% accuracy, 82.84% Macro-F1) terdokumentasi
- Notebook memiliki docstrings yang baik untuk fungsi training

---

## 3. Risk Map & Blocking Issues

**Metodologi**: `Risk Score = Impact (1-5) × Probability (1-5) / √Effort (hari)`

### Critical Path Issues — MUST FIX (Phase 0)

| ID | Issue | Impact | Prob. | Effort (hr) | Risk Score | Dimensi |
|---|---|---|---|---|---|---|
| R-01 | Tidak ada `requirements.txt` — project tidak bisa di-reproduce | 5 | 5 | 0.5 | **35.4** | Deployment |
| R-02 | Bug: model load failure = silent crash pada `/predict` (NameError) | 5 | 5 | 0.5 | **35.4** | Code Quality |
| R-03 | Model artifact tidak bisa di-reproduce dari repo | 5 | 5 | 1 | **25.0** | Deployment |
| R-04 | Zero test coverage — tidak ada jaminan kode berfungsi | 4 | 5 | 3 | **11.5** | Testing |
| R-05 | Tidak ada Dockerfile — tidak bisa di-demo dengan mudah | 4 | 4 | 2 | **11.3** | Deployment |
| R-06 | `requests.post()` tanpa timeout — UI bisa hang permanent | 4 | 4 | 0.1 | **50.6** | Code Quality |

### High Priority Issues — SHOULD FIX (Phase 1)

| ID | Issue | Impact | Prob. | Effort (hr) | Risk Score | Dimensi |
|---|---|---|---|---|---|---|
| R-07 | Tidak ada logging (hanya print()) | 4 | 4 | 1 | **16.0** | Observability |
| R-08 | Bug README (URL salah, referensi file yang di-gitignore) | 3 | 5 | 0.5 | **21.2** | Documentation |
| R-09 | Hardcoded config `MODEL_PATH` dan `API_URL` | 3 | 3 | 1 | **9.0** | Architecture |
| R-10 | Tidak ada `/health` endpoint — tidak ada cara check model loaded | 3 | 3 | 0.5 | **12.7** | Operations |
| R-11 | Tidak ada CI/CD pipeline | 3 | 4 | 2 | **8.5** | Deployment |

### Medium Priority (Phase 2)

| ID | Issue | Impact | Prob. | Effort (hr) | Risk Score | Dimensi |
|---|---|---|---|---|---|---|
| R-12 | Error detail leakage via `str(e)` di response | 2 | 3 | 0.5 | **8.5** | Security |
| R-13 | Tidak ada CORS config | 2 | 2 | 0.5 | **5.7** | Security |
| R-14 | Tidak ada model card | 2 | 3 | 1 | **6.0** | Documentation |
| R-15 | Sync inference block event loop | 2 | 2 | 3 | **1.3** | Architecture |

### Low Priority — Tech Debt (Phase 3)

| ID | Issue | Impact | Prob. | Effort (hr) | Risk Score | Dimensi |
|---|---|---|---|---|---|---|
| R-16 | Code style issues (trailing whitespace, PEP8) | 1 | 5 | 0.5 | **7.1** | Code Quality |
| R-17 | Tidak ada type annotations | 1 | 1 | 2 | **0.5** | Code Quality |
| R-18 | Tidak ada ADR | 1 | 1 | 2 | **0.5** | Architecture |
| R-19 | Tidak ada rate limiting | 1 | 1 | 1 | **1.0** | Security |

---

## 4. Production-Readiness Roadmap

### Phase 0: Critical Path (BLOCKING)
**Timeline**: 1–2 hari kerja  
**Goal**: Siapapun bisa clone repo ini dan menjalankan project mengikuti README

| Task | Detail | Effort | Skill |
|---|---|---|---|
| T-01 | Fix `requests.post()` tanpa timeout di `dashboard.py` L18: tambah `timeout=10` | 15 menit | Python |
| T-02 | Fix silent model-load failure di `main.py`: gunakan global flag `model_loaded` atau raise error yang di-handle di endpoint | 1 jam | Python/FastAPI |
| T-03 | Buat `requirements.txt` dengan versi pinned: `pip freeze > requirements.txt` dan filter ke dependency project saja | 30 menit | Python/DevOps |
| T-04 | Fix README: perbaiki URL format salah, hapus referensi ke file yang di-gitignore, tambah section "Model Setup" yang jelas | 1 jam | Documentation |
| T-05 | Tambah model setup script: push model ke HuggingFace Hub atau tambah script download otomatis di startup | 2–4 jam | ML/Python |
| T-06 | Tulis minimal 3 unit test: (a) valid prediction, (b) empty input, (c) model-not-loaded scenario | 2–3 jam | Python/pytest |

**Total Phase 0**: ~1 hari kerja penuh

---

### Phase 1: Production Foundation
**Timeline**: 1 minggu (bisa paralel dengan tail-end Phase 0)  
**Goal**: Project terlihat professional dan solid untuk portfolio

| Task | Detail | Effort | Skill |
|---|---|---|---|
| T-07 | Buat `Dockerfile` untuk FastAPI backend + `docker-compose.yml` orkestrasi backend+frontend | 1–2 hari | DevOps/Docker |
| T-08 | Buat GitHub Actions workflow: lint (flake8) + test (pytest) setiap push ke `main` | 2–3 jam | CI/CD/YAML |
| T-09 | Refactor config: gunakan `python-dotenv` atau `pydantic-settings` untuk `MODEL_PATH` dan `API_URL` dari `.env` | 2 jam | Python |
| T-10 | Tambah `/health` endpoint yang cek apakah model sudah loaded | 30 menit | FastAPI |
| T-11 | Ganti semua `print()` dengan `logging` module yang proper (log level, timestamp) | 2 jam | Python |
| T-12 | Fix README bug + tambah section Docker usage + troubleshooting common errors | 1 jam | Documentation |

**Total Phase 1**: 4–5 hari kerja

---

### Phase 2: Operational Excellence
**Timeline**: 2 minggu (setelah Phase 1)  
**Goal**: Project memiliki visibility dan professional polish

| Task | Detail | Effort | Skill |
|---|---|---|---|
| T-13 | Refactor `main.py`: pisahkan inference logic ke `src/model_service.py` | 1 hari | Python/Architecture |
| T-14 | Buat model card `MODEL_CARD.md`: dataset, metrics, bias, limitation, intended use | 2–3 jam | ML/Documentation |
| T-15 | Tambah CORS middleware ke FastAPI | 30 menit | FastAPI |
| T-16 | Fix error handling: jangan expose `str(e)` di response, log ke server-side saja | 1 jam | FastAPI |
| T-17 | Tambah integration test: test full request/response flow dengan `httpx.AsyncClient` | 2–3 jam | pytest/FastAPI |
| T-18 | Tambah `pyproject.toml` dengan konfigurasi flake8, pytest, coverage threshold (min 60%) | 1 jam | DevOps |

**Total Phase 2**: 5–7 hari kerja

---

### Phase 3: Tech Debt & Long-term Quality
**Timeline**: Open-ended, parallelizable dengan operasional

| Task | Detail | Effort |
|---|---|---|
| T-19 | Tambah type annotations ke semua fungsi | 2–3 jam |
| T-20 | Async inference: pindah ke background thread dengan `asyncio.run_in_executor` | 1–2 hari |
| T-21 | Eksplorasi HuggingFace Hub untuk distribusi model | 1 hari |
| T-22 | Deploy ke free hosting (HuggingFace Spaces, Railway, atau Render) untuk live demo | 1–2 hari |
| T-23 | Tambah CHANGELOG.md dan CONTRIBUTING.md | 1 jam |

---

## 5. Gap Analysis vs Production-Grade Standard

**Referensi**: ML portfolio project yang diklaim production-ready oleh developer ML engineer

| Kriteria | Expected | Current | Gap |
|---|---|---|---|
| `requirements.txt` dengan versi pinned | Wajib ada | Tidak ada | KRITIS |
| Unit test coverage >40% | Minimal | 0% | KRITIS |
| CI/CD pipeline minimal | GitHub Actions | Tidak ada | KRITIS |
| Dockerfile | Standar portfolio | Tidak ada | KRITIS |
| README bisa diikuti end-to-end | Wajib | Ada bug, model missing | HIGH |
| Error handling yang graceful | Best practice | Silent failure | HIGH |
| Logging dengan Python `logging` module | Standar | Hanya `print()` | MEDIUM |
| Health check endpoint | Untuk ops | Tidak ada | MEDIUM |
| Model card / dokumentasi model | Standar ML | Tidak ada | MEDIUM |
| Type annotations | Nice to have | Tidak ada | LOW |
| API authentication | Opsional untuk demo | Tidak ada | LOW |
| Architecture documentation | Nice to have | Tidak ada | LOW |

**Kesimpulan**: Project ini **7–8 kriteria di bawah** standar minimum portfolio-grade.

**Perbandingan industri**:
- vs Junior ML Portfolio: **Below expectation** — requirements.txt, Docker, minimal test adalah baseline
- vs ML API Tutorial: **At par** — tutorial projects biasanya memang tidak punya tests
- vs Production ML System: **Far below** — tidak relevan untuk dibandingkan saat ini

---

## 6. Go/No-Go Recommendation

**Rekomendasi untuk klaim "production-ready"**: **NOT_READY**

**Untuk konteks portfolio/demo**: **LAUNCH_WITH_RISK** — bisa di-share ke recruiter setelah Phase 0 selesai, dengan disclaimer bahwa ini adalah portfolio/demo project.

**Justifikasi**:
1. **R-01 + R-03**: Tidak ada `requirements.txt` dan model tidak bisa di-reproduce → siapapun yang clone tidak bisa menjalankan project ini. Dealbreaker untuk portfolio karena recruiter teknikal yang mau mencoba tidak bisa.
2. **R-02**: Bug silent failure pada model load → app "berjalan" tapi tidak berfungsi, sangat sulit di-debug.
3. **R-04 (zero tests)**: Untuk project yang diklaim "production-ready", ini adalah red flag serius bagi recruiter senior.

**Jika tetap ingin share sebelum Phase 0 selesai**:
- Tambahkan disclaimer di README: "Note: This is a portfolio/demo project. To run: train model first via notebook or contact author for model weights."
- Minimal fix T-01 (requests timeout) — hanya 15 menit

**Jika ingin declare production-ready**:
- Phase 0 (T-01 s/d T-06) harus selesai: ~1 hari kerja
- Phase 1 juga idealnya selesai untuk kesan professional: +4–5 hari

**Metric yang harus di-monitor setelah launch/demo**:
1. Apakah reviewer bisa menjalankan project dari awal (setup success rate)
2. Error rate pada endpoint `/predict`
3. Response time rata-rata inferensi

---

## 7. Follow-up & Monitoring

**Setelah Phase 0 selesai**: Verifikasi bahwa project bisa dijalankan end-to-end dari fresh clone:
```bash
git clone https://github.com/subki72/quant-market-sentiment-engine.git
cd quant-market-sentiment-engine
pip install -r requirements.txt
# ikuti instruksi model setup dari README
uvicorn src.main:app --reload
streamlit run src/dashboard.py
```

**Re-assess**: Lakukan mini re-audit setelah Phase 1 selesai (2 minggu dari sekarang). Fokus: apakah CI/CD jalan, apakah test pass, apakah Docker build berhasil.

**Quarterly check-in**: Setiap 3 bulan, update dependency di `requirements.txt` dan jalankan `pip-audit` untuk cek CVE baru.

**Trigger re-assessment penuh**: Jika project diputuskan untuk di-deploy ke cloud (HuggingFace Spaces, Railway, dll), lakukan re-audit fokus pada deployment dan security sebelum go-live.

---

## Appendix: Self-Verification Checklist

- [x] Semua 8 dimensi di Phase 2 sudah di-audit (Code Quality, Architecture, Testing, Security, Observability, Deployment, Operations, Documentation)
- [x] Setiap dimensi punya konkret finding dengan bukti (baris kode spesifik, output tools, file path)
- [x] Blocking issues sudah diidentifikasi eksplisit (R-01 s/d R-06 di Phase 0)
- [x] Risk scoring transparan: Impact, Probability, Effort, Risk Score semuanya ter-dokumentasi
- [x] Roadmap Phase 0: 6 task, total ~1 hari kerja (reasonable, di bawah batas 10 item)
- [x] Deliverable lengkap dengan semua section
- [x] Go/No-Go recommendation defensible berdasarkan Phase 0 completion status
- [x] Assessment independent dari klaim README — semua finding diverifikasi dari kode dan output tools aktual (flake8, pylint, ast analysis, git log)
