import { request } from "./client";

export function fetchMenus(token) {
  return request("/menus", { token });
}

export function fetchDashboard(token) {
  return request("/dashboard", { token });
}

export function fetchOperations(token) {
  return request("/operations", { token });
}

export function fetchProjects(token) {
  return request("/projects", { token });
}

export function fetchUsers(token) {
  return request("/users", { token });
}

export function createUser(token, payload) {
  return request("/users", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateUser(token, userId, payload) {
  return request(`/users/${userId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteUser(token, userId) {
  return request(`/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function assignUserRoles(token, userId, payload) {
  return request(`/users/${userId}/roles`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchRoles(token) {
  return request("/roles", { token });
}

export function createRole(token, payload) {
  return request("/roles", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateRole(token, roleId, payload) {
  return request(`/roles/${roleId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteRole(token, roleId) {
  return request(`/roles/${roleId}`, {
    method: "DELETE",
    token,
  });
}

export function assignRolePermissions(token, roleId, payload) {
  return request(`/roles/${roleId}/permissions`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function fetchPermissionMatrix(token) {
  return request("/permissions", { token });
}

export function fetchProfile(token) {
  return request("/profile", { token });
}

export function fetchSettings(token) {
  return request("/settings", { token });
}

export function updateSettings(token, payload) {
  return request("/settings", {
    method: "PUT",
    token,
    body: payload,
  });
}
