import { useAuth } from "../contexts/AuthContext";

export function PermissionGate({ code, type = "button", children, fallback = null }) {
  const { hasButtonPermission, hasPagePermission } = useAuth();
  const allowed =
    type === "page" ? hasPagePermission(code) : hasButtonPermission(code);

  return allowed ? children : fallback;
}
