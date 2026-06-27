import { useEffect, useState } from "react";
import { PencilLine, Plus } from "lucide-react";

import { fetchProjects } from "../api/rbac";
import { AppTable } from "../components/AppTable";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { PermissionGate } from "../components/PermissionGate";
import { useAuth } from "../contexts/AuthContext";

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects(token).then(setProjects);
  }, [token]);

  return (
    <div className="page-stack">
      <PageHeader
        title="项目中心"
        description="普通员工只能看到自己的项目，管理员可以看到更大范围数据。"
        actions={
          <div className="inline-actions">
            <PermissionGate code="button:project:create">
              <button className="primary-button" type="button">
                <Plus size={16} />
                <span>新建项目</span>
              </button>
            </PermissionGate>
            <PermissionGate code="button:project:edit">
              <button className="secondary-button" type="button">
                <PencilLine size={16} />
                <span>批量编辑</span>
              </button>
            </PermissionGate>
          </div>
        }
      />
      <InfoPanel title="项目列表">
        <AppTable
          columns={[
            { key: "name", title: "项目名称" },
            { key: "status", title: "状态" },
            { key: "progress", title: "进度", render: (value) => `${value}%` },
            { key: "visibility", title: "范围" },
            { key: "members", title: "成员", render: (value) => value.join("、") },
          ]}
          data={projects}
        />
      </InfoPanel>
    </div>
  );
}
