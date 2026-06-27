import { request } from "./client";

export function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", { token });
}

export function getCurrentPermissions(token) {
  return request("/permissions/current", { token });
}
