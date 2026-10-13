# Audit API & Keamanan Kontrak — End-to-End QA

---

## Ringkasan
- **Total Temuan**: 0 Critical, 0 High, 0 Medium, 0 Low
- **Integritas Kontrak API**: **100% RESOLVED (Hardened & Verified)**

---

## Riwayat Temuan & Remedi yang Telah Dieksekusi

### 1. [RESOLVED] — Dukungan Proteksi API Key & Throttling pada Endpoint Inferensi
- **File**: `src/api/routes.py` & `src/config.py`
- **Tindakan Perbaikan**:
  - Diterapkan arsitektur autentikasi opsional: Bila variabel lingkungan `API_KEY` disetel, sistem mewajibkan header `X-API-Key` atau `Authorization: Bearer <key>`. Jika tidak ada `API_KEY` (mode demo), endpoint tetap terbuka publik.
  - Ditambahkan IP rate limiter yang membatasi 60 request/menit untuk memitigasi serangan flooding.
- **Status**: **RESOLVED ✅**

---

## Verifikasi Kontrak Response & Status Code (19 Unit & Integration Tests PASS):
| Skenario | Endpoint | Ekspektasi | Hasil Aktual |
|---|---|---|---|
| Service Liveness | `GET /health` | HTTP 200 OK | PASS ✅ |
| Model Readiness (Loaded) | `GET /health/ready` | HTTP 200 OK | PASS ✅ |
| Model Readiness (Unready) | `GET /health/ready` | HTTP 503 Service Unavailable | PASS ✅ |
| Valid Input Sentiment | `POST /predict` | HTTP 200 OK (JSON valid) | PASS ✅ |
| Input Kosong / Whitespace | `POST /predict` | HTTP 400 Bad Request | PASS ✅ |
| Missing Text Key | `POST /predict` | HTTP 422 Unprocessable Entity | PASS ✅ |
| Rate Limit Exceeded | `POST /predict` | HTTP 429 Too Many Requests | PASS ✅ |
| Invalid API Key (when active) | `POST /predict` | HTTP 401 Unauthorized | PASS ✅ |
