import { useEffect, useState } from "react";

import { fetchDashboard } from "../api/rbac";
import { PageHeader } from "../components/PageHeader";
import { StatsGrid } from "../components/StatsGrid";
import { InfoPanel } from "../components/InfoPanel";
import { AppTable } from "../components/AppTable";
import { useAuth } from "../contexts/AuthContext";

export function DashboardPage() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetchDashboard(token).then(setDashboard);
  }, [token]);

  if (!dashboard) {
    return <div className="center-state">正在加载工作台...</div>;
  }

  const stats = [
    { label: "可见项目", value: dashboard.summary.projects, trend: "当前权限范围" },
    { label: "待办事项", value: dashboard.summary.todos, trend: "今日更新" },
    { label: "待审批", value: dashboard.summary.pending_reviews, trend: "需要关注" },
    { label: "当前角色数", value: dashboard.summary.role_count, trend: user.role_names.join("、") },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        title="工作台"
        description="根据登录角色动态汇总当前用户可访问的数据和任务。"
      />
      <StatsGrid items={stats} />

      <div className="two-column-grid">
        <InfoPanel title="系统播报">
          <ul className="plain-list">
            {dashboard.announcements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </InfoPanel>

        <InfoPanel title="权限摘要">
          <div className="meta-list">
            <div>
              <span>用户名</span>
              <strong>{user.username}</strong>
            </div>
            <div>
              <span>角色</span>
              <strong>{user.role_names.join("、")}</strong>
            </div>
            <div>
              <span>部门</span>
              <strong>{user.department}</strong>
            </div>
            <div>
              <span>最近登录</span>
              <strong>{user.last_login_at}</strong>
            </div>
          </div>
        </InfoPanel>
      </div>

      <InfoPanel title="可见项目概览" description="项目列表会随着角色权限变化而变化。">
        <AppTable
          columns={[
            { key: "name", title: "项目名称" },
            { key: "status", title: "状态" },
            { key: "progress", title: "进度", render: (value) => `${value}%` },
            { key: "visibility", title: "可见范围" },
            { key: "members", title: "成员", render: (value) => value.join("、") },
          ]}
          data={dashboard.projects}
        />
      </InfoPanel>
    </div>
  );
}
