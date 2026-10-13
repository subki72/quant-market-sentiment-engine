# Keamanan Penulisan Kode (Security) — Code Quality Audit

---

## Ringkasan
- **Total Temuan**: 0 Critical, 0 High, 0 Medium, 0 Low
- **Status Remedi**: **100% RESOLVED (Production-Grade Hardened)**

---

## Riwayat Temuan & Remedi yang Telah Dieksekusi

### 1. [RESOLVED] — Kebijakan Default Wildcard CORS pada Konfigurasi Template
- **File**: `.env.example` & `src/config.py`
- **Tindakan Perbaikan**:
  - Default `CORS_ORIGINS` diubah dari `*` menjadi `"http://localhost:3000,http://127.0.0.1:3000"`.
  - Fungsi `get_cors_origins()` memparsing daftar domain comma-separated secara aman.
  - Dokumentasi production deployment ditambahkan di `.env.example`.
- **Status**: **RESOLVED ✅**

### 2. [RESOLVED] — Ketiadaan Throttling / Rate Limiting pada Endpoint Publik
- **File**: `src/api/routes.py` & `src/config.py`
- **Tindakan Perbaikan**:
  - Ditambahkan in-memory sliding-window IP rate limiter (`check_rate_limit`) dengan parameter `RATE_LIMIT_PER_MINUTE=60` yang mengembalikan HTTP `429 Too Many Requests` saat kuota terlampaui.
  - Ditambahkan dukungan otentikasi opsional API Key (`verify_optional_api_key`) via header `X-API-Key` atau `Authorization: Bearer <key>`.
- **Status**: **RESOLVED ✅**

---

## Proteksi Keamanan yang Aktif:
1. **Zero Hardcoded Secrets**: Token HF dibaca aman via variabel lingkungan `os.getenv("HF_TOKEN")`.
2. **Sanitasi Error Response**: Exception internal di-catch dan di-mask; respons HTTP 500 tidak membocorkan stack trace server-side ke client (`src/api/routes.py`).
3. **Validasi Payload Ketat**: Pydantic Field membatasi `min_length=1, max_length=2000` mencegah payload raksasa yang membebani memori tokenizer.
4. **IP Throttling & Optional API Key**: Mencegah serangan denial-of-service / brute-force inference spam.
