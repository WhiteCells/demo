import { useEffect, useState } from "react";

import { fetchOperations } from "../api/rbac";
import { AppTable } from "../components/AppTable";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { StatsGrid } from "../components/StatsGrid";
import { useAuth } from "../contexts/AuthContext";

export function OperationsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchOperations(token).then(setData);
  }, [token]);

  if (!data) {
    return <div className="center-state">正在加载运营看板...</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="运营看板"
        description="不同角色看到的运营指标会按权限范围自动收敛。"
      />
      <StatsGrid items={data.cards} />
      <InfoPanel title="团队表现">
        <AppTable
          columns={[
            { key: "team", title: "团队" },
            { key: "conversion", title: "转化率" },
            { key: "satisfaction", title: "满意度" },
            { key: "risk", title: "风险等级" },
          ]}
          data={data.table}
        />
      </InfoPanel>
    </div>
  );
}
