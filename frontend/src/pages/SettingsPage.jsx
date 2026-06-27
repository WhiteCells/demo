import { useEffect, useState } from "react";

import { fetchSettings, updateSettings } from "../api/rbac";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { PermissionGate } from "../components/PermissionGate";
import { ShellForm } from "../components/ShellForm";
import { useAuth } from "../contexts/AuthContext";

export function SettingsPage() {
  const { token } = useAuth();
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings(token).then(setSettings);
  }, [token]);

  function updateField(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit() {
    const nextSettings = await updateSettings(token, settings);
    setSettings(nextSettings);
    setMessage("系统配置已更新");
  }

  if (!settings) {
    return <div className="center-state">正在加载系统配置...</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="系统配置"
        description="该页面仅 admin 可见，manager 无系统配置权限。"
      />
      {message ? <div className="feedback-banner">{message}</div> : null}
      <InfoPanel title="配置项">
        <PermissionGate
          code="button:settings:edit"
          fallback={<div className="empty-panel">当前角色仅可查看配置，无编辑权限。</div>}
        >
          <ShellForm
            title="编辑配置"
            description="模拟统一接口和按钮权限控制。"
            fields={[
              { name: "site_name", label: "站点名称" },
              {
                name: "security_level",
                label: "安全等级",
                type: "select",
                options: [
                  { value: "high", label: "high" },
                  { value: "medium", label: "medium" },
                  { value: "low", label: "low" },
                ],
              },
              {
                name: "login_notice",
                label: "登录提示",
                type: "textarea",
                rows: 5,
              },
            ]}
            value={settings}
            onChange={updateField}
            onSubmit={handleSubmit}
            submitText="保存配置"
          />
        </PermissionGate>
      </InfoPanel>
    </div>
  );
}
