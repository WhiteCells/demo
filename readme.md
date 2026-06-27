# RBAC 权限管理示例项目

这是一个可直接运行的完整 RBAC 示例，包含：

- 前端：React + Vite
- 后端：Python + FastAPI
- 数据源：纯 mock 数据，无真实数据库
- 权限模型：`用户 -> 角色 -> 权限`
- 权限粒度：菜单权限、页面权限、按钮权限、模块可见性

项目内预置了 `admin`、`manager`、`user` 三种角色，用于演示不同账号登录后系统视图、菜单、路由和操作按钮的差异。

## 整体架构设计

系统分为前后端两个子项目：

### 前端职责

- 提供登录页和后台管理界面
- 登录成功后保存 token 和当前用户权限
- 根据权限动态控制：
  - 左侧菜单显示内容
  - 路由访问
  - 页面内按钮显示
  - 某些模块是否可见

前端的权限控制分成三层：

1. 登录后从后端获取当前用户权限包
2. `AuthContext` 统一维护用户、菜单、权限码
3. 通过路由守卫和 `PermissionGate` 做页面级、按钮级控制

### 后端职责

- 提供统一格式的 mock API
- 维护用户、角色、权限、项目、系统配置等内存数据
- 根据用户绑定的角色，动态计算权限集合
- 对敏感接口做权限校验，不仅前端隐藏按钮，后端也会真正拒绝越权请求

### RBAC 数据关系

```text
User -> role_ids
Role -> permission_ids
Permission -> menu/page/button
```

例如：

- `admin`：拥有所有权限
- `manager`：拥有大部分业务权限，但没有删除和系统配置权限
- `user`：仅能查看与自己相关的数据和基础页面

## 项目目录结构

### 后端目录

```text
backend/
├── requirements.txt
└── app/
    ├── __init__.py
    ├── api.py
    ├── dependencies.py
    ├── main.py
    ├── mock_store.py
    ├── schemas.py
    └── services.py
```

### 前端目录

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── api/
    │   ├── auth.js
    │   ├── client.js
    │   └── rbac.js
    ├── components/
    │   ├── AppTable.jsx
    │   ├── InfoPanel.jsx
    │   ├── PageHeader.jsx
    │   ├── PermissionGate.jsx
    │   ├── ShellForm.jsx
    │   └── StatsGrid.jsx
    ├── contexts/
    │   └── AuthContext.jsx
    ├── layouts/
    │   └── AppLayout.jsx
    ├── pages/
    │   ├── DashboardPage.jsx
    │   ├── ForbiddenPage.jsx
    │   ├── LoginPage.jsx
    │   ├── OperationsPage.jsx
    │   ├── PermissionsPage.jsx
    │   ├── ProfilePage.jsx
    │   ├── ProjectsPage.jsx
    │   ├── RolesPage.jsx
    │   ├── SettingsPage.jsx
    │   └── UsersPage.jsx
    ├── router/
    │   ├── guards.jsx
    │   └── index.jsx
    ├── styles/
    │   └── global.css
    ├── utils/
    │   ├── icons.jsx
    │   ├── permissions.js
    │   └── storage.js
    └── main.jsx
```

## 核心实现说明

### 1. mock 数据与 RBAC 关系

后端在 [backend/app/mock_store.py](/home/cells/dev/demo/backend/app/mock_store.py) 中维护：

- `USERS`
- `ROLES`
- `PERMISSIONS`
- `PROJECTS`

其中：

- 用户通过 `role_ids` 关联角色
- 角色通过 `permission_ids` 关联权限
- 权限包含 `menu` / `page` / `button` 三类

### 2. 权限计算

[backend/app/services.py](/home/cells/dev/demo/backend/app/services.py) 中的 `build_permission_bundle` 会把角色权限汇总为：

- `menus`
- `page_permissions`
- `button_permissions`
- `all_permissions`

这样前端和后端都可以复用同一套权限结果。

### 3. 后端统一返回结构

所有接口返回统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

异常时也会返回统一结构，便于前端统一处理。

### 4. 后端权限拦截

[backend/app/dependencies.py](/home/cells/dev/demo/backend/app/dependencies.py) 中实现了 `require_permission`：

```python
def require_permission(permission_code: str):
    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        permission_bundle = build_permission_bundle(current_user)
        if permission_code not in permission_bundle["all_permissions"]:
            raise HTTPException(status_code=403, detail=f"Missing required permission: {permission_code}")
        return current_user
    return dependency
```

在接口中直接使用，例如：

```python
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: dict = Depends(require_permission("button:user:delete")),
) -> dict:
```

这意味着即使前端有人手动构造请求，后端仍会拦截越权操作。

### 5. 前端登录态与权限上下文

[frontend/src/contexts/AuthContext.jsx](/home/cells/dev/demo/frontend/src/contexts/AuthContext.jsx) 负责：

- 保存 token
- 保存用户信息
- 保存权限包
- 提供 `hasPagePermission`
- 提供 `hasButtonPermission`

### 6. 路由守卫

[frontend/src/router/guards.jsx](/home/cells/dev/demo/frontend/src/router/guards.jsx) 提供三类守卫：

- `AuthGuard`：未登录不能进入后台
- `GuestGuard`：已登录不能再回登录页
- `PermissionRoute`：无页面权限直接跳转 `403`

### 7. 按钮权限控制

[frontend/src/components/PermissionGate.jsx](/home/cells/dev/demo/frontend/src/components/PermissionGate.jsx) 用于做按钮级控制，例如：

```jsx
<PermissionGate code="button:user:delete">
  <button>删除</button>
</PermissionGate>
```

### 8. 动态菜单

左侧菜单不写死，而是使用当前权限包中的 `menus` 动态渲染，实现在不同角色登录时自动展示不同导航。

对应实现见 [frontend/src/layouts/AppLayout.jsx](/home/cells/dev/demo/frontend/src/layouts/AppLayout.jsx)。

## 已实现页面

### 通用页面

- 登录页
- 403 无权限页
- 工作台
- 个人中心

### 业务页面

- 运营看板
- 项目中心

### 权限管理页面

- 用户管理
- 角色管理
- 权限管理
- 用户分配角色
- 角色分配权限
- 系统配置

## Mock 接口列表

### 认证相关

- `POST /api/auth/login`
- `GET /api/auth/me`

### 权限相关

- `GET /api/menus`
- `GET /api/permissions/current`
- `GET /api/permissions`

### 页面数据相关

- `GET /api/dashboard`
- `GET /api/operations`
- `GET /api/projects`
- `GET /api/profile`
- `GET /api/settings`
- `PUT /api/settings`

### 用户管理

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{user_id}`
- `PUT /api/users/{user_id}/roles`
- `DELETE /api/users/{user_id}`

### 角色管理

- `GET /api/roles`
- `POST /api/roles`
- `PUT /api/roles/{role_id}`
- `PUT /api/roles/{role_id}/permissions`
- `DELETE /api/roles/{role_id}`

## 演示账号

| 角色 | 用户名 | 密码 | 权限效果 |
| --- | --- | --- | --- |
| admin | `admin` | `Admin123!` | 全部菜单、页面、按钮可见 |
| manager | `manager` | `Manager123!` | 无删除权限、无系统配置权限 |
| user | `user` | `User123!` | 仅能查看基础页面和个人相关数据 |

## 本地运行方式

### 1. 启动后端

在项目根目录执行：

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload
```

默认地址：

```text
http://127.0.0.1:8000
```

接口文档：

```text
http://127.0.0.1:8000/docs
```

### 2. 启动前端

新开一个终端：

```bash
cd frontend
npm install
npm run dev
```

默认地址：

```text
http://127.0.0.1:5173
```

## 如何测试不同角色的权限效果

### 使用 admin 登录

可以观察到：

- 左侧菜单完整显示
- 可进入用户管理、角色管理、权限管理、系统配置
- 页面内可见新增、编辑、删除、分配权限等操作

### 使用 manager 登录

可以观察到：

- 没有系统配置菜单
- 无法访问权限管理页面和系统配置页面
- 用户和角色管理中可新增、编辑，但删除按钮不可用
- 项目中心可新建和编辑项目

### 使用 user 登录

可以观察到：

- 左侧菜单只保留工作台、项目中心、个人中心
- 无法访问运营看板、用户管理、角色管理、权限管理、系统配置
- 页面中不会出现管理类按钮
- 工作台和项目中心只显示与自己相关的数据

## 可扩展方向

这个示例已经为后续替换真实数据库和真实认证预留了结构：

- `mock_store.py` 后续可替换为 ORM / Repository
- `services.py` 可继续沉淀权限聚合逻辑
- `dependencies.py` 可接 JWT、Redis、SSO
- 前端 `AuthContext` 可替换为真实 token 刷新机制
- 页面层组件已经按模块拆分，便于继续扩展

## 关键文件入口

- 后端入口：[backend/app/main.py](/home/cells/dev/demo/backend/app/main.py)
- 后端路由：[backend/app/api.py](/home/cells/dev/demo/backend/app/api.py)
- 后端 mock 数据：[backend/app/mock_store.py](/home/cells/dev/demo/backend/app/mock_store.py)
- 后端权限逻辑：[backend/app/services.py](/home/cells/dev/demo/backend/app/services.py)
- 前端入口：[frontend/src/main.jsx](/home/cells/dev/demo/frontend/src/main.jsx)
- 登录态与权限上下文：[frontend/src/contexts/AuthContext.jsx](/home/cells/dev/demo/frontend/src/contexts/AuthContext.jsx)
- 路由守卫：[frontend/src/router/guards.jsx](/home/cells/dev/demo/frontend/src/router/guards.jsx)
- 后台布局：[frontend/src/layouts/AppLayout.jsx](/home/cells/dev/demo/frontend/src/layouts/AppLayout.jsx)

## 当前说明

本项目已实现一个完整、可演示、结构清晰的 RBAC 示例，适合作为：

- 后台权限系统原型
- RBAC 学习示例
- 后续接入真实数据库与认证系统的起点项目
