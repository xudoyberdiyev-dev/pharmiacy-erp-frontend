import { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, login, logout, fetchMe, loading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('erp_token');
    if (token && !user) {
      fetchMe();
    } else {
      useAuthStore.setState({ loading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
