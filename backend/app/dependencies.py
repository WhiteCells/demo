from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status

from .services import (
    build_permission_bundle,
    get_roles_for_user,
    public_user,
    repo,
)


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    prefix = "mock-token-"
    if not token.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
        )

    raw_user_id = token.removeprefix(prefix)
    if not raw_user_id.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
        )

    user = repo.find_user_by_id(int(raw_user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist.",
        )
    return user


def get_current_user_public(authorization: str | None = Header(default=None)) -> dict:
    user = get_current_user(authorization)
    return public_user(user, get_roles_for_user(user))


def require_permission(permission_code: str) -> Callable[[dict], dict]:
    def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        permission_bundle = build_permission_bundle(current_user)
        if permission_code not in permission_bundle["all_permissions"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission_code}",
            )
        return current_user

    return dependency
