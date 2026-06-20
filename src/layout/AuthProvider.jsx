import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // Ilova ochilganda localStorage'dan tiklash
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // buzilgan data bo'lsa e'tiborsiz qoldiramiz
    } finally {
      setReady(true);
    }
  }, []);

  const persist = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Admin login — backenddan { token, user: { username, role: 'ADMIN', type: 'admin' } } keladi
  const loginAdmin = (newToken, adminUser) => {
    persist(newToken, { ...adminUser, role: "admin" });
  };

  // Employee login — backenddan { token, employee: { firstName, lastName, role, ... } } keladi
  const loginEmployee = (newToken, employeeUser) => {
    persist(newToken, { ...employeeUser, role: "employee" });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
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