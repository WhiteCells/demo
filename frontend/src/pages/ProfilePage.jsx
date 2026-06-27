import { useEffect, useState } from "react";

import { fetchProfile } from "../api/rbac";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { StatsGrid } from "../components/StatsGrid";
import { useAuth } from "../contexts/AuthContext";

export function ProfilePage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchProfile(token).then(setData);
  }, [token]);

  if (!data) {
    return <div className="center-state">正在加载个人资料...</div>;
  }

  const stats = [
    { label: "当前角色数", value: data.user.role_names.length, trend: "角色即权限载体" },
    { label: "我的项目", value: data.user.owned_project_count, trend: "可见范围内" },
    { label: "待办事项", value: data.user.todo_count, trend: "今日剩余" },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="个人中心"
        description="展示当前账号资料和角色说明，方便观察不同用户登录后的变化。"
      />
      <StatsGrid items={stats} />
      <div className="two-column-grid">
        <InfoPanel title="账号资料">
          <div className="meta-list">
            <div>
              <span>姓名</span>
              <strong>{data.user.name}</strong>
            </div>
            <div>
              <span>用户名</span>
              <strong>{data.user.username}</strong>
            </div>
            <div>
              <span>邮箱</span>
              <strong>{data.user.email}</strong>
            </div>
            <div>
              <span>部门</span>
              <strong>{data.user.department}</strong>
            </div>
            <div>
              <span>岗位</span>
              <strong>{data.user.title}</strong>
            </div>
            <div>
              <span>状态</span>
              <strong>{data.user.status}</strong>
            </div>
          </div>
        </InfoPanel>
        <InfoPanel title="角色说明">
          <div className="role-description-list">
            {data.role_descriptions.map((role) => (
              <article className="role-description-card" key={role.name}>
                <strong>{role.name}</strong>
                <p>{role.description}</p>
                <span>权限数量：{role.permission_count}</span>
              </article>
            ))}
          </div>
        </InfoPanel>
      </div>
    </div>
  );
}
