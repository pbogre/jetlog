from dataclasses import dataclass
from enum import Enum

from server.models import User


METADATA_READ = "metadata:read"
FLIGHTS_READ = "flights:read"
FLIGHTS_CREATE = "flights:create"
FLIGHTS_WRITE = "flights:write"
SUPPORTED_TOKEN_SCOPES = frozenset({
    METADATA_READ,
    FLIGHTS_READ,
    FLIGHTS_CREATE,
    FLIGHTS_WRITE,
})


class CredentialKind(str, Enum):
    JWT = "jwt"
    PROXY_HEADER = "proxy_header"
    PERSONAL_ACCESS_TOKEN = "personal_access_token"


@dataclass(frozen=True)
class AuthContext:
    user: User
    credential_kind: CredentialKind
    scopes: frozenset[str]
    token_id: int | None = None
    admin_allowed: bool = True

    @property
    def effective_user(self) -> User:
        if self.admin_allowed or not self.user.is_admin:
            return self.user
        return self.user.model_copy(update={"is_admin": False})
