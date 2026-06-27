import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  assignUserRoles,
  createUser,
  deleteUser,
  fetchRoles,
  fetchUsers,
  updateUser,
} from "../api/rbac";
import { AppTable } from "../components/AppTable";
import { InfoPanel } from "../components/InfoPanel";
import { PageHeader } from "../components/PageHeader";
import { PermissionGate } from "../components/PermissionGate";
import { ShellForm } from "../components/ShellForm";
import { useAuth } from "../contexts/AuthContext";

const initialCreateForm = {
  username: "",
  password: "Welcome123!",
  name: "",
  email: "",
  department: "",
  title: "",
  role_ids: "3",
  status: "active",
};

const initialEditForm = {
  id: "",
  name: "",
  email: "",
  department: "",
  title: "",
  status: "active",
};

const initialAssignForm = {
  user_id: "",
  role_ids: "",
};

export function UsersPage() {
  const { token, hasButtonPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [assignForm, setAssignForm] = useState(initialAssignForm);

  async function loadData() {
    const [nextUsers, nextRoles] = await Promise.all([
      fetchUsers(token),
      fetchRoles(token),
    ]);
    setUsers(nextUsers);
    setRoles(nextRoles);
  }

  useEffect(() => {
    loadData();
  }, [token]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: String(role.id), label: `${role.name} (${role.key})` })),
    [roles],
  );
  const canAssignRoles = hasButtonPermission("button:user:assign-role");

  function updateForm(setter, name, value) {
    setter((current) => ({ ...current, [name]: value }));
  }

  async function handleCreate() {
    setMessage("");
    await createUser(token, {
      ...createForm,
      role_ids: createForm.role_ids
        .split(",")
        .map((item) => Number(item.trim()))
        .filter(Boolean),
    });
    setCreateForm(initialCreateForm);
    setMessage("用户创建成功");
    await loadData();
  }

  async function handleUpdate() {
    if (!editForm.id) {
      setMessage("请先填写需要编辑的用户 ID");
      return;
    }
    await updateUser(token, Number(editForm.id), {
      name: editForm.name,
      email: editForm.email,
      department: editForm.department,
      title: editForm.title,
      status: editForm.status,
    });
    setMessage("用户编辑成功");
    setEditForm(initialEditForm);
    await loadData();
  }

  async function handleAssignRoles() {
    if (!assignForm.user_id) {
      setMessage("请填写需要分配角色的用户 ID");
      return;
    }
    await assignUserRoles(token, Number(assignForm.user_id), {
      role_ids: assignForm.role_ids
        .split(",")
        .map((item) => Number(item.trim()))
        .filter(Boolean),
    });
    setMessage("用户角色分配成功");
    setAssignForm(initialAssignForm);
    await loadData();
  }

  async function handleDelete(userId) {
    await deleteUser(token, userId);
    setMessage(`已删除用户 #${userId}`);
    await loadData();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="用户管理"
        description="这里展示用户和角色的关联关系，并通过按钮权限控制可执行的操作。"
      />

      {message ? <div className="feedback-banner">{message}</div> : null}

      <InfoPanel title="用户列表">
        <AppTable
          columns={[
            { key: "id", title: "ID" },
            { key: "name", title: "姓名" },
            { key: "username", title: "账号" },
            { key: "department", title: "部门" },
            { key: "title", title: "岗位" },
            { key: "role_names", title: "角色", render: (value) => value.join("、") },
            { key: "status", title: "状态" },
            {
              key: "actions",
              title: "操作",
              render: (_, row) => (
                <div className="row-actions">
                  <PermissionGate code="button:user:delete" fallback={<span className="muted-text">无删除权限</span>}>
                    <button
                      className="danger-text-button"
                      type="button"
                      onClick={() => handleDelete(row.id)}
                    >
                      <Trash2 size={15} />
                      <span>删除</span>
                    </button>
                  </PermissionGate>
                </div>
              ),
            },
          ]}
          data={users}
        />
      </InfoPanel>

      <div className="three-column-grid">
        <PermissionGate code="button:user:create">
          <ShellForm
            title="新增用户"
            description={
              canAssignRoles
                ? "输入基础资料和初始角色。"
                : "当前角色可新增用户，但新用户会默认分配为普通员工。"
            }
            fields={[
              { name: "username", label: "账号" },
              { name: "password", label: "初始密码" },
              { name: "name", label: "姓名" },
              { name: "email", label: "邮箱" },
              { name: "department", label: "部门" },
              { name: "title", label: "岗位" },
              ...(canAssignRoles
                ? [{ name: "role_ids", label: "角色 ID", placeholder: "例如 2,3" }]
                : []),
            ]}
            value={createForm}
            onChange={(name, value) => updateForm(setCreateForm, name, value)}
            onSubmit={handleCreate}
            submitText="创建用户"
          />
        </PermissionGate>

        <PermissionGate code="button:user:edit">
          <ShellForm
            title="编辑用户"
            description="通过用户 ID 修改资料。"
            fields={[
              { name: "id", label: "用户 ID", type: "number" },
              { name: "name", label: "姓名" },
              { name: "email", label: "邮箱" },
              { name: "department", label: "部门" },
              { name: "title", label: "岗位" },
              {
                name: "status",
                label: "状态",
                type: "select",
                options: [
                  { value: "active", label: "active" },
                  { value: "inactive", label: "inactive" },
                ],
              },
            ]}
            value={editForm}
            onChange={(name, value) => updateForm(setEditForm, name, value)}
            onSubmit={handleUpdate}
            submitText="保存修改"
          />
        </PermissionGate>

        <PermissionGate code="button:user:assign-role">
          <ShellForm
            title="分配角色"
            description={`可用角色：${roleOptions.map((item) => item.label).join(" / ") || "加载中"}`}
            fields={[
              { name: "user_id", label: "用户 ID", type: "number" },
              { name: "role_ids", label: "角色 ID", placeholder: "例如 1 或 2,3" },
            ]}
            value={assignForm}
            onChange={(name, value) => updateForm(setAssignForm, name, value)}
            onSubmit={handleAssignRoles}
            submitText="分配角色"
          />
        </PermissionGate>
      </div>
    </div>
  );
}
