import axios from 'axios';

// Production'da so'rovlar Vercel proxy orqali (/api/*, vercel.json'dagi
// rewrite) yuboriladi — brauzer nuqtai nazaridan bu 1-tomon (same-site)
// so'rov bo'lib qoladi, shuning uchun cookie Firefox/Safari/Yandex kabi
// uchinchi-tomon cookie'larni bloklaydigan brauzerlarda ham ishlaydi.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Fayllar (excel, rasm) va Socket.io esa proxy'dan aylanmasdan, backend'ning
// haqiqiy manziliga to'g'ridan-to'g'ri ulanadi (WebSocket proxy orqali
// ishonchli ishlamaydi) — shuning uchun bu alohida, doim mutlaq manzil.
export const FILE_BASE_URL = import.meta.env.VITE_BACKEND_ORIGIN
  || 'https://pharmacy-erp-backend-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  // Token endi httpOnly cookie orqali keladi — brauzer avtomatik yuboradi,
  // JavaScript'dan o'qib/yozib bo'lmaydi (XSS'dan himoya).
  withCredentials: true,
});

// Bu yo'llarga kelgan 401 — login/tekshirish jarayonining o'zi (noto'g'ri
// parol, eskirgan kod va h.k.), refresh urinib ko'rish yoki logout kerak emas.
const AUTH_PATHS = ['/auth/login', '/auth/verify-otp', '/auth/qr-login', '/auth/refresh'];

// Bir vaqtda bir nechta so'rov 401 bilan qaytsa, faqat BITTA /auth/refresh
// chaqiruvi yuborilishi uchun umumiy promise — qolganlari shuni kutadi.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (
      response?.status !== 401 ||
      !config ||
      config._retry ||
      AUTH_PATHS.some((p) => config.url?.includes(p))
    ) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').finally(() => { refreshPromise = null; });
      }
      await refreshPromise;
      return api(config);
    } catch {
      // Login sahifasida bo'lsak, qayta yo'naltirish shart emas — aks holda
      // fetchMe() -> 401 -> refresh 401 -> redirect -> remount -> fetchMe()
      // tarzida cheksiz reload aylanasi hosil bo'ladi.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  }
);

export default api;
