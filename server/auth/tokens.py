import hashlib
import json
import secrets
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import field_validator

from server.auth.context import SUPPORTED_TOKEN_SCOPES
from server.auth.dependencies import (
    PERSONAL_ACCESS_TOKEN_PREFIX,
    require_primary_auth,
)
from server.database import database
from server.models import CustomModel, User


router = APIRouter(
    prefix="/tokens",
    tags=["authentication"],
    redirect_slashes=True
)


class TokenStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class ApiTokenCreate(CustomModel):
    name: str
    scopes: list[str]
    expires_in_days: Literal[30, 90, 365] | None = 90

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Token name is required")
        if len(value) > 255:
            raise ValueError("Token name must be 255 characters or fewer")
        return value

    @field_validator("scopes")
    @classmethod
    def validate_scopes(cls, value: list[str]) -> list[str]:
        scopes = list(dict.fromkeys(value))
        if not scopes:
            raise ValueError("At least one scope is required")
        unsupported = set(scopes) - SUPPORTED_TOKEN_SCOPES
        if unsupported:
            raise ValueError(f"Unsupported token scope: {sorted(unsupported)[0]}")
        return scopes


class ApiTokenMetadata(CustomModel):
    id: int
    name: str
    scopes: list[str]
    expires_at: datetime | None
    last_used_at: datetime | None
    created_at: datetime
    revoked_at: datetime | None
    status: TokenStatus


class ApiTokenCreated(ApiTokenMetadata):
    token: str


def _as_utc(value: datetime | str | None) -> datetime | None:
    if value is None:
        return None
    parsed = value if isinstance(value, datetime) else datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _status(
    expires_at: datetime | str | None,
    revoked_at: datetime | str | None
) -> TokenStatus:
    if revoked_at is not None:
        return TokenStatus.REVOKED
    expiration = _as_utc(expires_at)
    if expiration is not None and expiration <= datetime.now(timezone.utc):
        return TokenStatus.EXPIRED
    return TokenStatus.ACTIVE


def _metadata_from_row(row: tuple) -> ApiTokenMetadata:
    (
        token_id,
        name,
        raw_scopes,
        expires_at,
        last_used_at,
        created_at,
        revoked_at,
    ) = row
    return ApiTokenMetadata(
        id=token_id,
        name=name,
        scopes=json.loads(raw_scopes),
        expires_at=_as_utc(expires_at),
        last_used_at=_as_utc(last_used_at),
        created_at=_as_utc(created_at),
        revoked_at=_as_utc(revoked_at),
        status=_status(expires_at, revoked_at)
    )


@router.get("", response_model=list[ApiTokenMetadata])
async def list_api_tokens(
    active_only: bool = True,
    user: User = Depends(require_primary_auth)
) -> list[ApiTokenMetadata]:
    active_filter = """
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > current_timestamp)
    """ if active_only else ""
    rows = database.execute_read_query(
        f"""
        SELECT id, name, scopes, expires_at, last_used_at,
               created_at, revoked_at
        FROM api_tokens
        WHERE user_id = ?
        {active_filter}
        ORDER BY created_at DESC, id DESC;
        """,
        [user.id]
    )
    return [_metadata_from_row(row) for row in rows]


@router.post("", status_code=201, response_model=ApiTokenCreated)
async def create_api_token(
    token_data: ApiTokenCreate,
    user: User = Depends(require_primary_auth)
) -> ApiTokenCreated:
    raw_token = PERSONAL_ACCESS_TOKEN_PREFIX + secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    token_prefix = raw_token[:12]

    expires_at = None
    if token_data.expires_in_days is not None:
        expiration = datetime.now(timezone.utc) + timedelta(
            days=token_data.expires_in_days
        )
        expires_at = expiration.strftime("%Y-%m-%d %H:%M:%S")

    inserted = database.execute_query(
        """
        INSERT INTO api_tokens
            (user_id, name, token_hash, token_prefix, scopes, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id;
        """,
        [
            user.id,
            token_data.name,
            token_hash,
            token_prefix,
            json.dumps(token_data.scopes),
            expires_at
        ]
    )
    token_id = inserted[0]
    row = database.execute_read_query(
        """
        SELECT id, name, scopes, expires_at, last_used_at,
               created_at, revoked_at
        FROM api_tokens
        WHERE id = ? AND user_id = ?;
        """,
        [token_id, user.id]
    )[0]
    metadata = _metadata_from_row(row)
    return ApiTokenCreated(**metadata.model_dump(), token=raw_token)


@router.delete("/{token_id}", status_code=204)
async def revoke_api_token(
    token_id: int,
    user: User = Depends(require_primary_auth)
) -> Response:
    revoked = database.execute_query(
        """
        UPDATE api_tokens
        SET revoked_at = current_timestamp
        WHERE id = ?
          AND user_id = ?
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > current_timestamp)
        RETURNING id;
        """,
        [token_id, user.id]
    )
    if not revoked:
        raise HTTPException(status_code=404, detail="Active token not found")
    return Response(status_code=204)
