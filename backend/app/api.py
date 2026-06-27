from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from .dependencies import get_current_user, require_permission
from .schemas import (
    AssignPermissionsPayload,
    AssignRolesPayload,
    LoginPayload,
    RoleCreatePayload,
    RoleUpdatePayload,
    SettingsPayload,
    UserCreatePayload,
    UserUpdatePayload,
)
from .services import (
    build_dashboard,
    build_operations_metrics,
    build_permission_bundle,
    get_permissions_for_role_ids,
    get_roles_for_user,
    permission_catalog,
    public_user,
    repo,
    role_list,
    user_has_permission,
    user_list,
    visible_projects_for_user,
)

router = APIRouter(prefix="/api")


def ok(data=None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


@router.post("/auth/login")
def login(payload: LoginPayload) -> dict:
    user = repo.find_user_by_username(payload.username)
    if user is None or user["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误。",
        )

    roles = get_roles_for_user(user)
    token = f"mock-token-{user['id']}"
    return ok(
        {
            "token": token,
            "user": public_user(user, roles),
            "permissions": build_permission_bundle(user),
        },
        "登录成功",
    )


@router.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    return ok(public_user(current_user, get_roles_for_user(current_user)))


@router.get("/menus")
def get_menus(current_user: dict = Depends(get_current_user)) -> dict:
    return ok(build_permission_bundle(current_user)["menus"])


@router.get("/permissions/current")
def get_current_permissions(current_user: dict = Depends(get_current_user)) -> dict:
    return ok(build_permission_bundle(current_user))


@router.get("/dashboard")
def get_dashboard(
    current_user: dict = Depends(require_permission("page:dashboard")),
) -> dict:
    return ok(build_dashboard(current_user))


@router.get("/operations")
def get_operations(
    current_user: dict = Depends(require_permission("page:operations")),
) -> dict:
    return ok(build_operations_metrics(current_user))


@router.get("/projects")
def get_projects(
    current_user: dict = Depends(require_permission("page:projects")),
) -> dict:
    return ok(visible_projects_for_user(current_user))


@router.get("/users")
def get_users(current_user: dict = Depends(require_permission("page:users"))) -> dict:
    return ok(user_list())


@router.post("/users")
def create_user(
    payload: UserCreatePayload,
    current_user: dict = Depends(require_permission("button:user:create")),
) -> dict:
    next_id = max(user["id"] for user in repo.users) + 1 if repo.users else 1
    role_ids = (
        payload.role_ids
        if user_has_permission(current_user, "button:user:assign-role")
        else [3]
    )
    user = {
        "id": next_id,
        "username": payload.username,
        "password": payload.password,
        "name": payload.name,
        "email": payload.email,
        "department": payload.department,
        "title": payload.title,
        "role_ids": role_ids,
        "status": payload.status,
        "owned_project_count": 0,
        "todo_count": 0,
        "last_login_at": "-",
    }
    repo.users.append(user)
    return ok(public_user(user, get_roles_for_user(user)), "用户创建成功")


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdatePayload,
    current_user: dict = Depends(require_permission("button:user:edit")),
) -> dict:
    user = repo.find_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在。")

    user.update(payload.model_dump())
    return ok(public_user(user, get_roles_for_user(user)), "用户更新成功")


@router.put("/users/{user_id}/roles")
def assign_roles(
    user_id: int,
    payload: AssignRolesPayload,
    current_user: dict = Depends(require_permission("button:user:assign-role")),
) -> dict:
    user = repo.find_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在。")

    valid_role_ids = {role["id"] for role in repo.roles}
    user["role_ids"] = [role_id for role_id in payload.role_ids if role_id in valid_role_ids]
    return ok(public_user(user, get_roles_for_user(user)), "用户角色分配成功")


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: dict = Depends(require_permission("button:user:delete")),
) -> dict:
    user = repo.find_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在。")

    repo.users = [item for item in repo.users if item["id"] != user_id]
    return ok(message="用户删除成功")


@router.get("/roles")
def get_roles(current_user: dict = Depends(require_permission("page:roles"))) -> dict:
    return ok(role_list())


@router.post("/roles")
def create_role(
    payload: RoleCreatePayload,
    current_user: dict = Depends(require_permission("button:role:create")),
) -> dict:
    next_id = max(role["id"] for role in repo.roles) + 1 if repo.roles else 1
    permission_ids = (
        payload.permission_ids
        if user_has_permission(current_user, "button:role:assign-permission")
        else []
    )
    role = {
        "id": next_id,
        "key": payload.key,
        "name": payload.name,
        "description": payload.description,
        "permission_ids": permission_ids,
    }
    repo.roles.append(role)
    return ok(role, "角色创建成功")


@router.put("/roles/{role_id}")
def update_role(
    role_id: int,
    payload: RoleUpdatePayload,
    current_user: dict = Depends(require_permission("button:role:edit")),
) -> dict:
    role = repo.find_role_by_id(role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="角色不存在。")

    role.update(payload.model_dump())
    return ok(role, "角色更新成功")


@router.put("/roles/{role_id}/permissions")
def assign_permissions(
    role_id: int,
    payload: AssignPermissionsPayload,
    current_user: dict = Depends(require_permission("button:role:assign-permission")),
) -> dict:
    role = repo.find_role_by_id(role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="角色不存在。")

    valid_permission_ids = {permission["id"] for permission in repo.permissions}
    role["permission_ids"] = [
        permission_id
        for permission_id in payload.permission_ids
        if permission_id in valid_permission_ids
    ]
    return ok(role, "角色权限分配成功")


@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    current_user: dict = Depends(require_permission("button:role:delete")),
) -> dict:
    role = repo.find_role_by_id(role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="角色不存在。")

    repo.roles = [item for item in repo.roles if item["id"] != role_id]
    for user in repo.users:
        user["role_ids"] = [item for item in user["role_ids"] if item != role_id]
    return ok(message="角色删除成功")


@router.get("/permissions")
def get_permissions(
    current_user: dict = Depends(require_permission("page:permissions")),
) -> dict:
    roles = []
    for role in repo.roles:
        permissions = get_permissions_for_role_ids([role["id"]])
        roles.append(
            {
                "id": role["id"],
                "key": role["key"],
                "name": role["name"],
                "permission_ids": role["permission_ids"],
                "permission_codes": [permission["code"] for permission in permissions],
            }
        )

    return ok(
        {
            "permissions": permission_catalog(),
            "roles": roles,
        }
    )


@router.get("/profile")
def get_profile(current_user: dict = Depends(require_permission("page:profile"))) -> dict:
    roles = get_roles_for_user(current_user)
    return ok(
        {
            "user": public_user(current_user, roles),
            "role_descriptions": [
                {
                    "name": role["name"],
                    "description": role["description"],
                    "permission_count": len(role["permission_ids"]),
                }
                for role in roles
            ],
        }
    )


@router.get("/settings")
def get_settings(
    current_user: dict = Depends(require_permission("page:settings")),
) -> dict:
    return ok(repo.settings)


@router.put("/settings")
def update_settings(
    payload: SettingsPayload,
    current_user: dict = Depends(require_permission("button:settings:edit")),
) -> dict:
    repo.settings = payload.model_dump()
    return ok(repo.settings, "系统配置更新成功")
