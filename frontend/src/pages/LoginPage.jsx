import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, UserCog, UserRound } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

const demoAccounts = [
  {
    role: "admin",
    username: "admin",
    password: "Admin123!",
    icon: ShieldCheck,
    description: "全量菜单、页面和按钮权限",
  },
  {
    role: "manager",
    username: "manager",
    password: "Manager123!",
    icon: UserCog,
    description: "可管理业务数据，无删除和系统配置权限",
  },
  {
    role: "user",
    username: "user",
    password: "User123!",
    icon: UserRound,
    description: "仅查看与自己相关的数据",
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    username: "admin",
    password: "Admin123!",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-copy">
          <span className="eyebrow">React + FastAPI + Mock Data</span>
          <h1>完整 RBAC 权限管理示例</h1>
          <p>
            展示用户、角色、权限三者之间的关联关系，以及菜单、路由、按钮级动态权限控制。
          </p>
        </div>
        <div className="demo-account-list">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <button
                key={account.role}
                type="button"
                className="demo-account-card"
                onClick={() =>
                  setForm({
                    username: account.username,
                    password: account.password,
                  })
                }
              >
                <div className="demo-account-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <strong>{account.role}</strong>
                  <span>{account.description}</span>
                  <small>
                    {account.username} / {account.password}
                  </small>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-header">
            <KeyRound size={22} />
            <div>
              <h2>登录系统</h2>
              <p>选择示例账号，体验不同角色对应的系统视图。</p>
            </div>
          </div>

          <label className="field">
            <span>用户名</span>
            <input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="请输入用户名"
            />
          </label>

          <label className="field">
            <span>密码</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="请输入密码"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button large-button" disabled={submitting} type="submit">
            {submitting ? "登录中..." : "立即登录"}
          </button>
        </form>
      </section>
    </div>
  );
}
