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

      login: async (phone, password) => {
        const res = await authAPI.login({ phone, password });
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
