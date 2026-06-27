from __future__ import annotations

from copy import deepcopy
from typing import Any

from .mock_store import clone_permissions, clone_projects, clone_roles, clone_users


class MockRepository:
    def __init__(self) -> None:
        self.users = clone_users()
        self.roles = clone_roles()
        self.permissions = clone_permissions()
        self.projects = clone_projects()
        self.settings = {
            "site_name": "RBAC Admin Console",
            "security_level": "high",
            "login_notice": "登录行为已接入 mock 审计日志。",
        }

    def find_user_by_username(self, username: str) -> dict[str, Any] | None:
        return next((item for item in self.users if item["username"] == username), None)

    def find_user_by_id(self, user_id: int) -> dict[str, Any] | None:
        return next((item for item in self.users if item["id"] == user_id), None)

    def find_role_by_id(self, role_id: int) -> dict[str, Any] | None:
        return next((item for item in self.roles if item["id"] == role_id), None)

    def find_permission_by_id(self, permission_id: str) -> dict[str, Any] | None:
        return next((item for item in self.permissions if item["id"] == permission_id), None)


repo = MockRepository()


def public_user(user: dict[str, Any], roles: list[dict[str, Any]]) -> dict[str, Any]:
    role_keys = [role["key"] for role in roles]
    role_names = [role["name"] for role in roles]
    return {
        "id": user["id"],
        "username": user["username"],
        "name": user["name"],
        "email": user["email"],
        "department": user["department"],
        "title": user["title"],
        "status": user["status"],
        "role_ids": user["role_ids"],
        "role_keys": role_keys,
        "role_names": role_names,
        "owned_project_count": user["owned_project_count"],
        "todo_count": user["todo_count"],
        "last_login_at": user["last_login_at"],
    }


def get_roles_for_user(user: dict[str, Any]) -> list[dict[str, Any]]:
    return [role for role in repo.roles if role["id"] in user["role_ids"]]


def get_permissions_for_role_ids(role_ids: list[int]) -> list[dict[str, Any]]:
    permission_ids: set[str] = set()
    for role in repo.roles:
        if role["id"] in role_ids:
            permission_ids.update(role["permission_ids"])
    return [permission for permission in repo.permissions if permission["id"] in permission_ids]


def build_permission_bundle(user: dict[str, Any]) -> dict[str, Any]:
    permissions = get_permissions_for_role_ids(user["role_ids"])
    menus = sorted(
        [item for item in permissions if item["type"] == "menu"],
        key=lambda item: item.get("order", 0),
    )
    pages = [item for item in permissions if item["type"] == "page"]
    buttons = [item for item in permissions if item["type"] == "button"]

    return {
        "menus": [
            {
                "id": item["id"],
                "name": item["name"],
                "code": item["code"],
                "route": item.get("route", ""),
                "icon": item.get("icon", "circle"),
                "module": item["module"],
            }
            for item in menus
        ],
        "page_permissions": [item["code"] for item in pages],
        "button_permissions": [item["code"] for item in buttons],
        "all_permissions": [item["code"] for item in permissions],
    }


def user_has_permission(user: dict[str, Any], permission_code: str) -> bool:
    return permission_code in build_permission_bundle(user)["all_permissions"]


def build_dashboard(user: dict[str, Any]) -> dict[str, Any]:
    roles = get_roles_for_user(user)
    role_keys = {role["key"] for role in roles}

    if "admin" in role_keys:
        pending_reviews = 5
        visible_projects = repo.projects
        announcements = [
            "系统配置与角色授权已开启全量管理模式",
            "请关注权限变更后的审计回放结果",
        ]
    elif "manager" in role_keys:
        pending_reviews = 3
        visible_projects = [
            project
            for project in repo.projects
            if project["visibility"] in {"department", "personal"}
        ]
        announcements = [
            "本周项目进度已同步到运营看板",
            "你可以新增和编辑业务数据，但无法删除数据",
        ]
    else:
        pending_reviews = 1
        visible_projects = [
            project
            for project in repo.projects
            if project["owner_user_id"] == user["id"] or project["visibility"] == "personal"
        ]
        announcements = [
            "这里只展示与你相关的数据",
            "如需额外权限，请联系管理员进行角色分配",
        ]

    return {
        "summary": {
            "projects": len(visible_projects),
            "todos": user["todo_count"],
            "pending_reviews": pending_reviews,
            "role_count": len(user["role_ids"]),
        },
        "announcements": announcements,
        "projects": visible_projects,
    }


def build_operations_metrics(user: dict[str, Any]) -> dict[str, Any]:
    roles = get_roles_for_user(user)
    role_keys = {role["key"] for role in roles}

    if "admin" in role_keys:
        return {
            "cards": [
                {"label": "本月活跃用户", "value": 1268, "trend": "+12%"},
                {"label": "权限变更次数", "value": 38, "trend": "+4"},
                {"label": "高优先工单", "value": 9, "trend": "-2"},
            ],
            "table": [
                {"team": "运营一组", "conversion": "23.4%", "satisfaction": "97%", "risk": "低"},
                {"team": "客户成功", "conversion": "19.8%", "satisfaction": "95%", "risk": "中"},
            ],
        }

    if "manager" in role_keys:
        return {
            "cards": [
                {"label": "本周线索数", "value": 312, "trend": "+8%"},
                {"label": "待处理异常", "value": 6, "trend": "-1"},
                {"label": "项目延期数", "value": 2, "trend": "0"},
            ],
            "table": [
                {"team": "北区", "conversion": "21.3%", "satisfaction": "96%", "risk": "低"},
                {"team": "华东", "conversion": "18.5%", "satisfaction": "94%", "risk": "中"},
            ],
        }

    return {
        "cards": [
            {"label": "我的任务", "value": user["todo_count"], "trend": "今日"},
            {"label": "待回访客户", "value": 12, "trend": "+2"},
            {"label": "完成率", "value": "88%", "trend": "+5%"},
        ],
        "table": [
            {"team": "个人", "conversion": "16.2%", "satisfaction": "98%", "risk": "低"},
        ],
    }


def visible_projects_for_user(user: dict[str, Any]) -> list[dict[str, Any]]:
    role_keys = {role["key"] for role in get_roles_for_user(user)}
    if "admin" in role_keys:
        return deepcopy(repo.projects)
    if "manager" in role_keys:
        return [
            project
            for project in deepcopy(repo.projects)
            if project["visibility"] in {"department", "personal"}
            or project["owner_user_id"] == user["id"]
        ]
    return [
        project
        for project in deepcopy(repo.projects)
        if project["owner_user_id"] == user["id"] or project["visibility"] == "personal"
    ]


def user_list() -> list[dict[str, Any]]:
    return [public_user(user, get_roles_for_user(user)) for user in repo.users]


def role_list() -> list[dict[str, Any]]:
    data = []
    for role in repo.roles:
        data.append(
            {
                **role,
                "permission_count": len(role["permission_ids"]),
                "user_count": sum(role["id"] in user["role_ids"] for user in repo.users),
            }
        )
    return data


def permission_catalog() -> list[dict[str, Any]]:
    return deepcopy(repo.permissions)
