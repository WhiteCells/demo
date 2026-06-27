import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentPermissions, getCurrentUser, login as loginApi } from "../api/auth";
import { clearAuthState, loadAuthState, saveAuthState } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [{ token, user, permissions, menus }, setAuthState] = useState(() => {
    const cached = loadAuthState();
    return {
      token: cached.token,
      user: cached.authState?.user || null,
      permissions: cached.authState?.permissions || null,
      menus: cached.authState?.permissions?.menus || [],
    };
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token || user || permissions) {
      setLoading(false);
      return;
    }

    let ignore = false;
    async function bootstrap() {
      try {
        const [nextUser, nextPermissions] = await Promise.all([
          getCurrentUser(token),
          getCurrentPermissions(token),
        ]);
        if (ignore) {
          return;
        }
        const nextState = {
          token,
          user: nextUser,
          permissions: nextPermissions,
          menus: nextPermissions.menus,
        };
        setAuthState(nextState);
        saveAuthState(token, {
          user: nextUser,
          permissions: nextPermissions,
        });
      } catch {
        if (!ignore) {
          clearAuthState();
          setAuthState({
            token: null,
            user: null,
            permissions: null,
            menus: [],
          });
          setLoading(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      ignore = true;
    };
  }, [token, user, permissions]);

  async function login(payload) {
    const response = await loginApi(payload);
    const nextState = {
      token: response.token,
      user: response.user,
      permissions: response.permissions,
      menus: response.permissions.menus,
    };
    setAuthState(nextState);
    saveAuthState(response.token, {
      user: response.user,
      permissions: response.permissions,
    });
  }

  function logout() {
    clearAuthState();
    setAuthState({
      token: null,
      user: null,
      permissions: null,
      menus: [],
    });
  }

  const value = useMemo(
    () => ({
      token,
      user,
      permissions,
      menus,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(token && user && permissions),
      hasPagePermission: (code) =>
        Boolean(permissions?.page_permissions?.includes(code)),
      hasButtonPermission: (code) =>
        Boolean(permissions?.button_permissions?.includes(code)),
    }),
    [token, user, permissions, menus, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
