import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      setLoading: (loading) => set({ loading }),

      // SYSTEM_OWNER uchun ikkinchi bosqich (Telegram OTP) talab qilinishi
      // mumkin — shu holatda token/user saqlanmaydi, { requiresOtp, userId }
      // qaytariladi va chaqiruvchi verifyOtp() bilan davom ettirishi kerak.
      // Boshqa rollarda hozirgidek bir martalik { user } qaytadi.
      login: async (phone, password) => {
        const res = await authAPI.login({ phone, password });
        if (res.data.requiresOtp) {
          return { requiresOtp: true, userId: res.data.userId };
        }
        const { token, user } = res.data;
        set({ token, user });
        localStorage.setItem('erp_token', token);
        return { user };
      },

      verifyOtp: async (userId, code) => {
        const res = await authAPI.verifyOtp({ userId, code });
        const { token, user } = res.data;
        set({ token, user });
        localStorage.setItem('erp_token', token);
        return user;
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      },

      updateUser: (patch) => set(s => ({ user: { ...s.user, ...patch } })),

      fetchMe: async () => {
        try {
          set({ loading: true });
          const res = await authAPI.me();
          set({ user: res.data.user });
        } catch {
          get().logout();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
