import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'https://pharmacy-erp-backend-production.up.railway.app/api';

// // Yuklangan fayllar (excel, rasm) shu bazadan ochiladi: `${FILE_BASE_URL}${order.productsExcelUrl}`
// export const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Yuklangan fayllar (excel, rasm) shu bazadan ochiladi: `${FILE_BASE_URL}${order.productsExcelUrl}`
export const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Request — tokenni qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response — 401 bo'lsa logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
