import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, ready } = useAuth();

  if (!ready) return null;

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  // type: 'admin' | 'employee'
  if (allowedRoles && !allowedRoles.includes(user?.type)) {
    return <Navigate to="/" replace />;
  }

  return children;
}