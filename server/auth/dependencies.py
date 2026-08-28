import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Callable

import jwt
from fastapi import BackgroundTasks, Depends, HTTPException, Request

from server.auth.context import (
    AuthContext,
    CredentialKind,
    SUPPORTED_TOKEN_SCOPES,
)
from server.auth.utils import get_user, get_user_by_id, oauth2_scheme
from server.database import database
from server.environment import AUTH_HEADER, SECRET_KEY
from server.models import User


ALGORITHM = "HS256"
PERSONAL_ACCESS_TOKEN_PREFIX = "jl_pat_"
PERSONAL_ACCESS_TOKEN_PATTERN = re.compile(r"^jl_pat_[A-Za-z0-9_-]{43}$")


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=401,
        headers={"WWW-Authenticate": "Bearer"},
        detail="Invalid token"
    )


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _get_user_from_proxy_header(request: Request) -> AuthContext | None:
    if AUTH_HEADER is None or AUTH_HEADER not in request.headers:
        return None

    username = request.headers.get(AUTH_HEADER)
    user = get_user(username) if username else None
    if not user:
        raise HTTPException(
            status_code=403,
            detail=(
                "Username supplied in header does not exist, "
                "please have your instance admin create this user."
            )
        )

    return AuthContext(
        user=user,
        credential_kind=CredentialKind.PROXY_HEADER,
        scopes=SUPPORTED_TOKEN_SCOPES
    )


def _get_user_from_jwt(token: str) -> AuthContext:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise _credentials_exception()
    except jwt.InvalidTokenError:
        raise _credentials_exception()

    user = get_user(username)
    if not user:
        raise _credentials_exception()

    return AuthContext(
        user=user,
        credential_kind=CredentialKind.JWT,
        scopes=SUPPORTED_TOKEN_SCOPES
    )


def _get_user_from_personal_access_token(
    token: str,
    background_tasks: BackgroundTasks
) -> AuthContext:
    if not PERSONAL_ACCESS_TOKEN_PATTERN.fullmatch(token):
        raise _credentials_exception()

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    result = database.execute_read_query(
        """
        SELECT id, user_id, scopes, expires_at, revoked_at
        FROM api_tokens
        WHERE token_hash = ?;
        """,
        [token_hash]
    )
    if not result:
        raise _credentials_exception()

    token_id, user_id, raw_scopes, expires_at, revoked_at = result[0]
    if revoked_at is not None:
        raise _credentials_exception()

    if expires_at is not None:
        try:
            parsed_expiration = _as_utc(datetime.fromisoformat(expires_at))
        except (TypeError, ValueError):
            raise _credentials_exception()
        if parsed_expiration <= datetime.now(timezone.utc):
            raise _credentials_exception()

    try:
        scopes = frozenset(json.loads(raw_scopes))
    except (TypeError, ValueError):
        raise _credentials_exception()
    if not scopes or not scopes.issubset(SUPPORTED_TOKEN_SCOPES):
        raise _credentials_exception()

    user = get_user_by_id(user_id)
    if not user:
        raise _credentials_exception()

    background_tasks.add_task(database.update_api_token_last_used, token_id)
    return AuthContext(
        user=user,
        credential_kind=CredentialKind.PERSONAL_ACCESS_TOKEN,
        scopes=scopes,
        token_id=token_id,
        admin_allowed=False
    )


async def get_auth_context(
    request: Request,
    background_tasks: BackgroundTasks,
    token: str | None = Depends(oauth2_scheme)
) -> AuthContext:
    proxy_context = _get_user_from_proxy_header(request)
    if proxy_context is not None:
        return proxy_context

    if not token:
        raise _credentials_exception()

    if token.startswith(PERSONAL_ACCESS_TOKEN_PREFIX):
        return _get_user_from_personal_access_token(token, background_tasks)
    return _get_user_from_jwt(token)


async def get_current_user(
    context: AuthContext = Depends(get_auth_context)
) -> User:
    return context.effective_user


def require_scope(scope: str) -> Callable:
    async def scoped_user(
        context: AuthContext = Depends(get_auth_context)
    ) -> User:
        if (
            context.credential_kind == CredentialKind.PERSONAL_ACCESS_TOKEN
            and scope not in context.scopes
        ):
            raise HTTPException(
                status_code=403,
                headers={
                    "WWW-Authenticate": f'Bearer error="insufficient_scope", scope="{scope}"'
                },
                detail=f"Token requires scope '{scope}'"
            )
        return context.effective_user

    return scoped_user


async def require_primary_auth(
    context: AuthContext = Depends(get_auth_context)
) -> User:
    if context.credential_kind == CredentialKind.PERSONAL_ACCESS_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Personal access tokens cannot access this endpoint"
        )
    return context.user
