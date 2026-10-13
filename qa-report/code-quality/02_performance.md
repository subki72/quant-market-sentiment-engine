# Performa & Efisiensi — Code Quality Audit

---

## Ringkasan
- **Total Temuan**: 0 Critical, 0 High, 0 Medium, 0 Low
- **Status Remedi**: **100% RESOLVED (Optimal Asynchronous Engine & Client)**

---

## Riwayat Temuan & Remedi yang Telah Dieksekusi

### 1. [RESOLVED] — Polling Health Check Interval Statis di Frontend saat Tab Inactive
- **File**: `frontend/src/app/page.tsx`
- **Tindakan Perbaikan**:
  - Ditambahkan pengecekan `document.hidden` di dalam fungsi interval `checkHealth()`. Jika tab browser tidak aktif/tersembunyi, request jaringan dilewati untuk menghemat resource.
  - Ditambahkan event listener `visibilitychange` yang langsung memicu pengecekan status saat pengguna kembali membuka tab aktif.
- **Status**: **RESOLVED ✅**

---

## Optimasi Performa yang Telah Berjalan Sempurna:
1. **Isolasi Thread Asinkron**: Komputasi PyTorch CPU matrix multiplication dijalankan melalui `asyncio.to_thread` di `SentimentService.predict()`, memastikan event loop FastAPI tetap 100% responsif terhadap concurrent traffic.
2. **Kalkulasi Tanpa Gradien**: Pembungkus `with torch.no_grad():` mencegah alokasi computational graph autograd di RAM.
3. **Singleton Model Caching**: Bobot model dimuat 1 kali saat startup lifespan dan disimpan di memori, tanpa overhead pembacaan disk per request.
4. **Fast First-Load Next.js**: Halaman frontend di-compile menjadi static route (`9.28 kB` HTML, `96.5 kB` First Load JS) menjamin render instan di browser.
5. **Background Tab Network Throttling**: Mencegah request polling sia-sia saat window browser di-minimize atau berpindah tab.
