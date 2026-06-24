import axios from "axios";

const BASE_URL = "http://localhost:3000/api/v1";


const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Har bir request oldidan token qo'shadi
api.interceptors.request.use((config) => {
  if (config.auth === false) {
    return config;
  }

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
// Response xatolarini ushlaydi
api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(
        new Error(response.data.message || "Xatolik yuz berdi")
      );
    }

    return response.data?.data ?? response.data;
  },
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error(
          "Serverga ulanib bo'lmadi. Internetni yoki backendni tekshiring."
        )
      );
    }

    const err = new Error(
      error.response.data?.message ||
        `Xatolik yuz berdi (${error.response.status})`
    );

    err.status = error.response.status;

    return Promise.reject(err);
  }
);

export default api;