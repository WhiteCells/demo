import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="center-state">正在加载登录态...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function GuestGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="center-state">正在加载登录态...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PermissionRoute({ code, children }) {
  const { hasPagePermission } = useAuth();

  if (!hasPagePermission(code)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
