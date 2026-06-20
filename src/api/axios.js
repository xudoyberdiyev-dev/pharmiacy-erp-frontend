const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async post(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Server xatosi");
    return data;
  },

  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Server xatosi");
    return data;
  },
};

export const authAPI = {
  loginAdmin: (creds) => api.post("/auth/login", creds),
  qrLogin: (qrToken) => api.post("/auth/qr-login", { qrToken }),
};

export const employeeAPI = {
  create: (data) => api.post("/employee", data),
  getAll: () => api.get("/employee"),
};