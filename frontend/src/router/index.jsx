import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AuthGuard, GuestGuard, PermissionRoute } from "./guards";
import { DashboardPage } from "../pages/DashboardPage";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import { LoginPage } from "../pages/LoginPage";
import { OperationsPage } from "../pages/OperationsPage";
import { PermissionsPage } from "../pages/PermissionsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RolesPage } from "../pages/RolesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { UsersPage } from "../pages/UsersPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    path: "/403",
    element: <ForbiddenPage />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <PermissionRoute code="page:dashboard">
            <DashboardPage />
          </PermissionRoute>
        ),
      },
      {
        path: "operations",
        element: (
          <PermissionRoute code="page:operations">
            <OperationsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "projects",
        element: (
          <PermissionRoute code="page:projects">
            <ProjectsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "users",
        element: (
          <PermissionRoute code="page:users">
            <UsersPage />
          </PermissionRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <PermissionRoute code="page:roles">
            <RolesPage />
          </PermissionRoute>
        ),
      },
      {
        path: "permissions",
        element: (
          <PermissionRoute code="page:permissions">
            <PermissionsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <PermissionRoute code="page:settings">
            <SettingsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <PermissionRoute code="page:profile">
            <ProfilePage />
          </PermissionRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
