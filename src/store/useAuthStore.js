import { create } from 'zustand';
import { authAPI } from '../api';

// Token endi httpOnly cookie orqali boshqariladi — bu store'da hech qanday
// token saqlanmaydi va localStorage'ga yozilmaydi (XSS'dan himoya uchun).
// Sahifa yangilanganda foydalanuvchi ma'lumoti fetchMe() orqali qayta
// so'raladi (cookie mavjud bo'lsa muvaffaqiyatli, aks holda login sahifasi).
export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,

  setLoading: (loading) => set({ loading }),

  // SYSTEM_OWNER uchun ikkinchi bosqich (Telegram OTP) talab qilinishi
  // mumkin — shu holatda user saqlanmaydi, { requiresOtp, userId }
  // qaytariladi va chaqiruvchi verifyOtp() bilan davom ettirishi kerak.
  // Boshqa rollarda hozirgidek bir martalik { user } qaytadi.
  login: async (phone, password) => {
    const res = await authAPI.login({ phone, password });
    if (res.data.requiresOtp) {
      return { requiresOtp: true, userId: res.data.userId };
    }
    const { user } = res.data;
    set({ user });
    return { user };
  },

  verifyOtp: async (userId, code) => {
    const res = await authAPI.verifyOtp({ userId, code });
    const { user } = res.data;
    set({ user });
    return user;
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Server bilan bog'lanib bo'lmasa ham lokal holatni tozalaymiz
    }
    set({ user: null });
  },

  updateUser: (patch) => set(s => ({ user: { ...s.user, ...patch } })),

  fetchMe: async () => {
    try {
      set({ loading: true });
      const res = await authAPI.me();
      set({ user: res.data.user });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));
