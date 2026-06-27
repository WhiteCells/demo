import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="center-screen">
      <div className="status-card">
        <h1>403</h1>
        <p>当前角色没有访问该页面的权限。</p>
        <Link className="primary-button link-button" to="/dashboard">
          返回工作台
        </Link>
      </div>
    </div>
  );
}
