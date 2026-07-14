import { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, login, verifyOtp, logout, fetchMe, updateUser, loading } = useAuthStore();

  useEffect(() => {
    // Token endi httpOnly cookie'da — JavaScript'dan uning bor-yo'qligini
    // bilib bo'lmaydi, shuning uchun har doim fetchMe() chaqiriladi: cookie
    // mavjud bo'lsa muvaffaqiyatli bo'ladi, aks holda user null qoladi va
    // login sahifasi ko'rsatiladi.
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
