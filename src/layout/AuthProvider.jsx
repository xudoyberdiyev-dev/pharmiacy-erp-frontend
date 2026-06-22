import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // Ilova ochilganda localStorage'dan tiklash + tokenni backend orqali tekshirish
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          // token hali ham yaroqliligini tekshiramiz (muddati o'tgan bo'lishi mumkin)
          await authAPI.getMe();
        } catch {
          // token yaroqsiz/muddati o'tgan — chiqaramiz
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      }
      setReady(true);
    };
    init();
  }, []);

  const persist = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Admin login — backend { token, user: { id, username, role: 'ADMIN', type: 'admin' } } qaytaradi
  const loginAdmin = (newToken, adminUser) => {
    persist(newToken, adminUser);
  };

  // Employee login — backend { token, user: { id, firstName, lastName, role, type: 'employee' } } qaytaradi
  const loginEmployee = (newToken, employeeUser) => {
    persist(newToken, employeeUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,           // { id, username/firstName+lastName, role, type }
    token,
    ready,
    isAuthenticated: !!token,
    loginAdmin,
    loginEmployee,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi shart");
  return ctx;
}