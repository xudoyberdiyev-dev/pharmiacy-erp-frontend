import { apiFetch } from "./axios";

export const authAPI = {
  adminLogin: (username, password) =>
    apiFetch("/auth/admin/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    }),

  qrLogin: (qrToken) =>
    apiFetch("/auth/qr-login", {
      method: "POST",
      body: { qrToken },
      auth: false,
    }),

  getMe: () => apiFetch("/auth/me", { method: "GET" }),
};