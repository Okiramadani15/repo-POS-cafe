import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ─── Instance ─────────────────────────────────────────────────────────────────
// Content-Type TIDAK di-set di sini karena akan di-handle di request interceptor.
// Jika di-set di sini sebagai default, header ini akan menimpa multipart/form-data
// boundary yang dibutuhkan multer saat upload file.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  timeout: 10000,
});

// ─── Helper: Bersihkan session & redirect ke login ────────────────────────────
function clearSessionAndRedirect(reason?: string) {
  if (typeof window === 'undefined') return;

  console.warn(`[axios] Session dihapus — alasan: ${reason ?? 'unknown'}`);
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');

  // Hindari redirect loop jika sudah di halaman login
  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach token JWT + atur Content-Type secara otomatis
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Untuk FormData (upload file): JANGAN set Content-Type — biarkan browser
    // menyertakan boundary otomatis (multipart/form-data; boundary=xxxx).
    // Untuk request lain (JSON): set application/json.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  // ✅ Response sukses — teruskan langsung
  (response) => response,

  // ❌ Response error — tangani berdasarkan code dari backend
  (error: AxiosError<{ status: string; code: string; message: string; retryAfter?: number }>) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code;

    // ── Autentikasi gagal / session tidak valid ──
    if (status === 401) {
      const authErrorCodes = ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_MISSING', 'TOKEN_NOT_ACTIVE'];
      if (!code || authErrorCodes.includes(code)) {
        clearSessionAndRedirect(code ?? `HTTP 401`);
      }
      // Jika 401 karena INVALID_CREDENTIALS (dari login), jangan redirect — biarkan halaman login handle sendiri
    }

    // ── Akses ditolak (role tidak cukup) ──
    if (status === 403 && code === 'FORBIDDEN') {
      console.warn('[axios] 403 Forbidden — role tidak memiliki akses ke resource ini.');
      // Tidak redirect — biarkan komponen menampilkan pesan "Tidak punya akses"
    }

    // ── Server error sementara — log saja ──
    if (status && status >= 500) {
      console.error(`[axios] Server error ${status}:`, error.response?.data?.message);
    }

    // ── Tidak ada response (network error / timeout / backend mati) ──
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('[axios] Request timeout — server tidak merespons dalam batas waktu.');
      } else {
        console.error('[axios] Network error — tidak dapat terhubung ke server.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;