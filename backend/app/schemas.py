from __future__ import annotations

from pydantic import BaseModel, Field


class LoginPayload(BaseModel):
    username: str
    password: str


class UserCreatePayload(BaseModel):
    username: str
    password: str
    name: str
    email: str
    department: str
    title: str
    role_ids: list[int] = Field(default_factory=list)
    status: str = "active"


class UserUpdatePayload(BaseModel):
    name: str
    email: str
    department: str
    title: str
    status: str = "active"


class AssignRolesPayload(BaseModel):
    role_ids: list[int]


class RoleCreatePayload(BaseModel):
    key: str
    name: str
    description: str
    permission_ids: list[str] = Field(default_factory=list)


class RoleUpdatePayload(BaseModel):
    name: str
    description: str


class AssignPermissionsPayload(BaseModel):
    permission_ids: list[str]


class SettingsPayload(BaseModel):
    site_name: str
    security_level: str
    login_notice: str

