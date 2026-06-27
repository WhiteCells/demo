const TOKEN_KEY = "rbac-demo-token";
const AUTH_KEY = "rbac-demo-auth";

export function loadAuthState() {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const authState = window.localStorage.getItem(AUTH_KEY);

  return {
    token,
    authState: authState ? JSON.parse(authState) : null,
  };
}

export function saveAuthState(token, authState) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
}

export function clearAuthState() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(AUTH_KEY);
}
