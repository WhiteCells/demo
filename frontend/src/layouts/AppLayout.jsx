import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { MenuIcon } from "../utils/icons";

export function AppLayout() {
  const { user, menus, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <span className="brand-badge">RBAC</span>
          <div>
            <strong>Admin Console</strong>
            <p>角色驱动的后台演示系统</p>
          </div>
        </div>
        <nav className="nav-list">
          {menus.map((menu) => (
            <NavLink
              key={menu.id}
              to={menu.route}
              className={({ isActive }) =>
                `nav-item${isActive ? " nav-item-active" : ""}`
              }
            >
              <MenuIcon name={menu.icon} />
              <span>{menu.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <h1>欢迎回来，{user?.name}</h1>
            <p>
              {user?.department} / {user?.role_names?.join("、")}
            </p>
          </div>
          <div className="topbar-actions">
            <div className="user-pill">
              <span>{user?.username}</span>
              <small>{user?.title}</small>
            </div>
            <button className="ghost-icon-button" onClick={handleLogout} type="button">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
