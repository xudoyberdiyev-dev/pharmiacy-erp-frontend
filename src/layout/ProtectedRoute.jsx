import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, ready } = useAuth();

  // localStorage'dan tiklanguncha hech narsa ko'rsatmaymiz (login sahifasiga otib ketmasin)
  if (!ready) return null;

  if (!isAuthenticated) {
    // Qaysi panel so'ralganiga qarab to'g'ri login sahifasiga yuboramiz
    const loginPath = allowedRoles?.includes("admin") ? "/admin-login" : "/employee-login";
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Login qilgan, lekin bu sahifaga ruxsati yo'q — o'z paneliga qaytaramiz
    const fallback = user?.role === "admin" ? "/" : "/employee";
    return <Navigate to={fallback} replace />;
  }

  return children;
}