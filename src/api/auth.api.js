import api from "./axios";

export const authAPI = {
  adminLogin: async (username, password) => {
    const res = await api.post(
      "/auth/admin/login",
      { username, password },
      {
        headers: {
          Authorization: undefined, // token yubormaydi
        },
      }
    );

    return res;
  },

  qrLogin: async (qrToken) => {
    const res = await api.post(
      "/auth/qr-login",
      { qrToken },
      {
        headers: {
          Authorization: undefined,
        },
      }
    );

    return res;
  },

  getMe: async () => {
    const res = await api.get("/auth/me");
    return res;
  },
};