# RBAC 权限管理示例项目

这是一个可直接运行的完整 RBAC 示例，包含：

- 前端：React + Vite
- 后端：Python + FastAPI
- 数据源：纯 mock 数据，无真实数据库
- 权限模型：`用户 -> 角色 -> 权限`
- 权限粒度：菜单权限、页面权限、按钮权限、模块可见性
- 目录实现方式：当前 demo 把“目录/菜单”作为 `menu` 类型权限存放

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

### 角色、权限、目录的数据关系

```text
User -> role_ids
Role -> permission_ids
Permission -> menu/page/button
```

在这个示例里，“目录”不是单独一张表，而是直接放在 `Permission` 里，通过 `type = menu` 区分：

- `menu:*` 控制左侧目录是否展示
- `page:*` 控制路由页面是否允许进入
- `button:*` 控制页面内操作按钮是否允许展示和调用

也就是说，当前项目实际采用的是：

```text
用户(User)
  -> 角色(Role)
    -> 权限(Permission)
       -> 权限类型(type = menu/page/button)
```

例如：

- `admin`：拥有所有权限
- `manager`：拥有大部分业务权限，但没有删除和系统配置权限
- `user`：仅能查看与自己相关的数据和基础页面

如果把这套 mock 数据落到真实数据库，推荐先按下面的关系理解：

```text
users
  通过 user_roles 与 roles 多对多关联

roles
  通过 role_permissions 与 permissions 多对多关联

permissions
  用 type 区分 menu / page / button
  当 type = menu 时，这条权限同时携带目录展示信息
```

可对应成下面这个 ER 关系：

```text
users --< user_roles >-- roles --< role_permissions >-- permissions
```

推荐的基础表结构可以是：

```text
users
- id
- username
- password_hash
- name
- status

roles
- id
- key
- name
- description

permissions
- id
- code
- name
- type            // menu | page | button
- module
- route           // menu/page 常用
- icon            // menu 常用
- order_index     // menu 排序
- description

user_roles
- user_id
- role_id

role_permissions
- role_id
- permission_id
```

这套设计和当前 demo 是一一对应的，只是示例里为了便于演示，把 `user_roles` 和 `role_permissions` 两张中间表分别压缩成了 `role_ids`、`permission_ids` 两个数组字段。

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

### 1. 当前 mock 数据如何映射数据库关系

后端在 [backend/app/mock_store.py](/home/cells/dev/demo/backend/app/mock_store.py) 中维护：

- `USERS`
- `ROLES`
- `PERMISSIONS`
- `PROJECTS`

它们对应数据库中的含义分别是：

- `USERS` 对应用户表
- `ROLES` 对应角色表
- `PERMISSIONS` 对应权限表
- `USERS.role_ids` 相当于 `user_roles`
- `ROLES.permission_ids` 相当于 `role_permissions`

其中 `PERMISSIONS` 本身就同时承载了“目录权限、页面权限、按钮权限”三种数据：

- 目录权限示例：`menu-dashboard` / `menu:dashboard`
- 页面权限示例：`page-users` / `page:users`
- 按钮权限示例：`button-role-delete` / `button:role:delete`

目录相关字段也直接放在权限对象里：

- `route`：目录点击后的跳转地址
- `icon`：前端菜单图标
- `order`：目录排序
- `module`：所属模块

所以这个项目里“目录”和“权限”不是两套数据，而是“目录是一种特殊的权限数据”。

### 2. 后端如何实现权限管理

后端权限链路主要分成四步。

#### 第一步：根据用户角色汇总权限

[backend/app/services.py](/home/cells/dev/demo/backend/app/services.py) 中的 `get_permissions_for_role_ids` 会先根据 `role_ids` 找出角色拥有的全部权限；然后 `build_permission_bundle` 再把权限拆成前端更容易消费的结构：

- `menus`
- `page_permissions`
- `button_permissions`
- `all_permissions`

其中：

- `menus` 给前端渲染目录
- `page_permissions` 给前端做路由守卫
- `button_permissions` 给前端控制按钮显示
- `all_permissions` 给后端统一做接口鉴权

这样前后端虽然关注点不同，但都基于同一份权限计算结果。

#### 第二步：登录时下发权限包

[backend/app/api.py](/home/cells/dev/demo/backend/app/api.py) 的 `POST /api/auth/login` 在返回 token 的同时，也会返回：

- `user`
- `permissions`

这里的 `permissions` 就是后端实时计算出来的权限包，前端登录后无需自己拼装角色权限，只需要直接消费。

#### 第三步：请求时识别当前用户

[backend/app/dependencies.py](/home/cells/dev/demo/backend/app/dependencies.py) 中的 `get_current_user` 会从 `Authorization: Bearer <token>` 中解析出当前用户，再交给后续依赖做权限判断。

补充一下，这个项目的后端接口统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

异常时也会返回统一结构，便于前端统一处理。

#### 第四步：接口级权限拦截

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

这意味着：

- 页面按钮即使被前端隐藏了，后端依然会校验
- 用户即使手动抓包重放请求，后端也会返回 `403`
- 真正的权限边界是在后端，而不是前端

例如当前项目中的接口权限就是这样分层的：

- `page:*` 权限保护查询页面接口，如 `GET /api/users`
- `button:*` 权限保护写操作接口，如 `DELETE /api/users/{user_id}`
- `menu:*` 不直接保护接口，而是主要服务于前端目录渲染

### 3. 前端如何实现权限管理

前端权限链路也分成四层。

#### 第一层：登录态和权限状态统一收口

[frontend/src/contexts/AuthContext.jsx](/home/cells/dev/demo/frontend/src/contexts/AuthContext.jsx) 负责：

- 保存 token
- 保存用户信息
- 保存权限包
- 保存动态菜单 `menus`
- 暴露 `hasPagePermission`
- 暴露 `hasButtonPermission`

登录后，前端把后端返回的 `permissions` 缓存在上下文里；刷新页面时如果本地还有 token，则会再调用：

- `GET /api/auth/me`
- `GET /api/permissions/current`

重新恢复当前用户和权限包。

#### 第二层：路由级权限控制

[frontend/src/router/guards.jsx](/home/cells/dev/demo/frontend/src/router/guards.jsx) 提供三类守卫：

- `AuthGuard`：未登录不能进入后台
- `GuestGuard`：已登录不能再回登录页
- `PermissionRoute`：无页面权限直接跳转 `403`

[frontend/src/router/index.jsx](/home/cells/dev/demo/frontend/src/router/index.jsx) 中每个页面路由都会绑定一个 `page:*` 权限，例如：

- `/users` 对应 `page:users`
- `/roles` 对应 `page:roles`
- `/settings` 对应 `page:settings`

这保证了“地址栏直接输入路由”也无法绕过页面权限。

#### 第三层：按钮级权限控制

[frontend/src/components/PermissionGate.jsx](/home/cells/dev/demo/frontend/src/components/PermissionGate.jsx) 用于做按钮级控制，例如：

```jsx
<PermissionGate code="button:user:delete">
  <button>删除</button>
</PermissionGate>
```

页面里只要把危险操作或管理操作包在 `PermissionGate` 中，就能根据 `button:*` 权限自动决定是否渲染。

#### 第四层：目录级动态渲染

左侧菜单不写死，而是使用当前权限包中的 `menus` 动态渲染，实现在不同角色登录时自动展示不同导航。

对应实现见 [frontend/src/layouts/AppLayout.jsx](/home/cells/dev/demo/frontend/src/layouts/AppLayout.jsx)。

这部分的关键点是：

- 后端返回当前用户可见的 `menus`
- 前端只遍历 `menus` 渲染侧边栏
- 因为目录本质上也是权限数据，所以角色一变，目录就会自动变化

### 4. 角色、权限、目录三者在前后端的协作方式

整个权限流程可以概括成下面这条链路：

```text
用户登录
-> 后端根据用户角色聚合权限
-> 返回 menus / page_permissions / button_permissions
-> 前端缓存权限包
-> menus 控制左侧目录
-> page_permissions 控制路由访问
-> button_permissions 控制页面按钮
-> 后端 require_permission 兜底拦截真实请求
```

如果以后把 mock 数据替换成真实数据库，前后端实现思路其实不用变，只需要把：

- `role_ids` 改成查 `user_roles`
- `permission_ids` 改成查 `role_permissions`
- `PERMISSIONS` 改成数据库权限表

而 `build_permission_bundle -> 前端消费权限包 -> 后端依赖鉴权` 这条主链路可以原样保留。

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
