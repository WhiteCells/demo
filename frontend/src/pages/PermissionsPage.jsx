import { useEffect, useState } from "react";

import { fetchPermissionMatrix } from "../api/rbac";
import { AppTable } from "../components/AppTable";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";

export function PermissionsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchPermissionMatrix(token).then(setData);
  }, [token]);

  if (!data) {
    return <div className="center-state">正在加载权限矩阵...</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="权限管理"
        description="统一查看系统中的菜单、页面、按钮权限，以及角色与权限之间的绑定关系。"
      />
      <div className="two-column-grid">
        <InfoPanel title="权限列表">
          <AppTable
            columns={[
              { key: "name", title: "权限名" },
              { key: "code", title: "权限码" },
              { key: "type", title: "类型" },
              { key: "module", title: "模块" },
              { key: "description", title: "说明" },
            ]}
            data={data.permissions}
          />
        </InfoPanel>

        <InfoPanel title="角色权限映射">
          <AppTable
            columns={[
              { key: "name", title: "角色" },
              { key: "key", title: "标识" },
              {
                key: "permission_codes",
                title: "权限码",
                render: (value) => value.join("、"),
              },
            ]}
            data={data.roles}
          />
        </InfoPanel>
      </div>
    </div>
  );
}
