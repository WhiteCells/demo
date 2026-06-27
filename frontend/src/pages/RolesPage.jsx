import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  assignRolePermissions,
  createRole,
  deleteRole,
  fetchPermissionMatrix,
  fetchRoles,
  updateRole,
} from "../api/rbac";
import { AppTable } from "../components/AppTable";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { PermissionGate } from "../components/PermissionGate";
import { ShellForm } from "../components/ShellForm";
import { useAuth } from "../contexts/AuthContext";

const initialCreateForm = {
  key: "",
  name: "",
  description: "",
  permission_ids: "",
};

const initialEditForm = {
  id: "",
  name: "",
  description: "",
};

const initialAssignForm = {
  role_id: "",
  permission_ids: "",
};

export function RolesPage() {
  const { token, hasButtonPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissionMatrix, setPermissionMatrix] = useState(null);
  const [message, setMessage] = useState("");
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [assignForm, setAssignForm] = useState(initialAssignForm);

  const canAssignPermissions = hasButtonPermission("button:role:assign-permission");

  async function loadData() {
    const requests = [fetchRoles(token)];
    if (canAssignPermissions) {
      requests.push(fetchPermissionMatrix(token));
    }
    const [nextRoles, nextPermissionMatrix] = await Promise.all(requests);
    setRoles(nextRoles);
    setPermissionMatrix(nextPermissionMatrix || null);
  }

  useEffect(() => {
    loadData();
  }, [token, canAssignPermissions]);

  function updateForm(setter, name, value) {
    setter((current) => ({ ...current, [name]: value }));
  }

  async function handleCreate() {
    await createRole(token, {
      ...createForm,
      permission_ids: createForm.permission_ids
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setCreateForm(initialCreateForm);
    setMessage("角色创建成功");
    await loadData();
  }

  async function handleUpdate() {
    if (!editForm.id) {
      setMessage("请填写角色 ID");
      return;
    }
    await updateRole(token, Number(editForm.id), {
      name: editForm.name,
      description: editForm.description,
    });
    setEditForm(initialEditForm);
    setMessage("角色更新成功");
    await loadData();
  }

  async function handleAssignPermissions() {
    if (!assignForm.role_id) {
      setMessage("请填写角色 ID");
      return;
    }
    await assignRolePermissions(token, Number(assignForm.role_id), {
      permission_ids: assignForm.permission_ids
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setAssignForm(initialAssignForm);
    setMessage("角色权限分配成功");
    await loadData();
  }

  async function handleDelete(roleId) {
    await deleteRole(token, roleId);
    setMessage(`已删除角色 #${roleId}`);
    await loadData();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="角色管理"
        description="角色是用户和权限之间的桥梁，可在这里维护权限集合。"
      />
      {message ? <div className="feedback-banner">{message}</div> : null}

      <InfoPanel title="角色列表">
        <AppTable
          columns={[
            { key: "id", title: "ID" },
            { key: "name", title: "角色名" },
            { key: "key", title: "角色标识" },
            { key: "description", title: "描述" },
            { key: "permission_count", title: "权限数" },
            { key: "user_count", title: "关联用户数" },
            {
              key: "actions",
              title: "操作",
              render: (_, row) => (
                <PermissionGate code="button:role:delete" fallback={<span className="muted-text">无删除权限</span>}>
                  <button
                    className="danger-text-button"
                    type="button"
                    onClick={() => handleDelete(row.id)}
                  >
                    <Trash2 size={15} />
                    <span>删除</span>
                  </button>
                </PermissionGate>
              ),
            },
          ]}
          data={roles}
        />
      </InfoPanel>

      <div className="three-column-grid">
        <PermissionGate code="button:role:create">
          <ShellForm
            title="新增角色"
            description={
              canAssignPermissions
                ? "创建新的权限集合。"
                : "当前角色可创建角色基础信息，但不能直接分配权限。"
            }
            fields={[
              { name: "key", label: "角色标识", placeholder: "例如 auditor" },
              { name: "name", label: "角色名称" },
              { name: "description", label: "描述" },
              ...(canAssignPermissions
                ? [
                    {
                      name: "permission_ids",
                      label: "权限 ID",
                      placeholder: "例如 page-dashboard,menu-dashboard",
                    },
                  ]
                : []),
            ]}
            value={createForm}
            onChange={(name, value) => updateForm(setCreateForm, name, value)}
            onSubmit={handleCreate}
            submitText="创建角色"
          />
        </PermissionGate>

        <PermissionGate code="button:role:edit">
          <ShellForm
            title="编辑角色"
            description="通过角色 ID 修改角色信息。"
            fields={[
              { name: "id", label: "角色 ID", type: "number" },
              { name: "name", label: "角色名称" },
              { name: "description", label: "描述" },
            ]}
            value={editForm}
            onChange={(name, value) => updateForm(setEditForm, name, value)}
            onSubmit={handleUpdate}
            submitText="保存角色"
          />
        </PermissionGate>

        <PermissionGate code="button:role:assign-permission">
          <ShellForm
            title="分配权限"
            description="将权限 ID 列表绑定到指定角色。"
            fields={[
              { name: "role_id", label: "角色 ID", type: "number" },
              { name: "permission_ids", label: "权限 ID", placeholder: "用英文逗号分隔" },
            ]}
            value={assignForm}
            onChange={(name, value) => updateForm(setAssignForm, name, value)}
            onSubmit={handleAssignPermissions}
            submitText="分配权限"
          />
        </PermissionGate>
      </div>

      {canAssignPermissions ? (
        <InfoPanel
          title="权限 ID 参考"
          description="这里列出后端 mock 数据中的全部权限项，方便角色分配时直接使用。"
        >
          <div className="permission-chip-grid">
            {permissionMatrix?.permissions?.map((permission) => (
              <div className="permission-chip" key={permission.id}>
                <strong>{permission.id}</strong>
                <span>{permission.code}</span>
              </div>
            ))}
          </div>
        </InfoPanel>
      ) : null}
    </div>
  );
}
