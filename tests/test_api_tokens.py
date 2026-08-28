import hashlib
import json
import tempfile

from fastapi.testclient import TestClient

from server.auth import dependencies
from server.auth.utils import hash_password
from server.database import Database, database


def create_token(
    client: TestClient,
    headers: dict[str, str],
    scopes: list[str],
    name: str = "Test client",
    expires_in_days: int | None = 90,
) -> dict:
    response = client.post(
        "/api/tokens",
        headers=headers,
        json={
            "name": name,
            "scopes": scopes,
            "expiresInDays": expires_in_days,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def pat_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_api_token_schema_and_foreign_keys(client: TestClient):
    columns = {
        row[1] for row in database.execute_read_query("PRAGMA table_info(api_tokens);")
    }
    assert columns == {
        "id", "user_id", "name", "token_hash", "token_prefix", "scopes",
        "expires_at", "last_used_at", "created_at", "revoked_at",
    }
    assert database.execute_read_query("PRAGMA foreign_keys;") == [(1,)]

    user_id = database.execute_query(
        "INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id;",
        ["cascade-user", hash_password("secret")],
    )[0]
    database.execute_query(
        """
        INSERT INTO api_tokens (user_id, name, token_hash, token_prefix, scopes)
        VALUES (?, 'Cascade', ?, 'jl_pat_casca', '[\"flights:read\"]');
        """,
        [user_id, "a" * 64],
    )
    database.execute_query("DELETE FROM users WHERE id = ?;", [user_id])
    assert database.execute_read_query(
        "SELECT id FROM api_tokens WHERE user_id = ?;", [user_id]
    ) == []


def test_existing_database_receives_token_table():
    with tempfile.TemporaryDirectory(prefix="jetlog-migration-") as data_path:
        legacy = Database(data_path)
        legacy.execute_query("DROP TABLE api_tokens;")
        legacy.connection.close()

        migrated = Database(data_path)
        columns = {
            row[1]
            for row in migrated.execute_read_query("PRAGMA table_info(api_tokens);")
        }
        migrated.connection.close()

    assert "token_hash" in columns
    assert "revoked_at" in columns


def test_trusted_proxy_header_remains_primary_auth(
    client: TestClient,
    monkeypatch,
):
    monkeypatch.setattr(dependencies, "AUTH_HEADER", "X-Remote-User")
    headers = {"X-Remote-User": "admin"}
    assert client.get("/api/users/me", headers=headers).status_code == 200
    assert client.get("/api/tokens", headers=headers).status_code == 200


def test_token_lifecycle_and_one_time_secret(
    client: TestClient,
    primary_headers: dict[str, str],
):
    created = create_token(client, primary_headers, ["metadata:read"])
    raw_token = created["token"]

    assert raw_token.startswith("jl_pat_")
    assert "tokenPrefix" not in created
    assert created["status"] == "active"

    stored = database.execute_read_query(
        "SELECT token_hash, token_prefix, scopes FROM api_tokens WHERE id = ?;",
        [created["id"]],
    )[0]
    assert stored[0] == hashlib.sha256(raw_token.encode()).hexdigest()
    assert stored[0] != raw_token
    assert stored[1] == raw_token[:12]
    assert json.loads(stored[2]) == ["metadata:read"]

    listed = client.get("/api/tokens", headers=primary_headers)
    assert listed.status_code == 200
    assert "token" not in listed.json()[0]
    assert "tokenHash" not in listed.json()[0]
    assert "tokenPrefix" not in listed.json()[0]

    me = client.get("/api/users/me", headers=pat_headers(raw_token))
    assert me.status_code == 200
    assert me.json()["username"] == "admin"
    assert "passwordHash" not in me.json()
    assert database.execute_read_query(
        "SELECT last_used_at FROM api_tokens WHERE id = ?;", [created["id"]]
    )[0][0] is not None

    cannot_chain = client.get("/api/tokens", headers=pat_headers(raw_token))
    assert cannot_chain.status_code == 403

    revoked = client.delete(
        f"/api/tokens/{created['id']}", headers=primary_headers
    )
    assert revoked.status_code == 204
    assert client.get("/api/tokens", headers=primary_headers).json() == []

    history = client.get(
        "/api/tokens", headers=primary_headers, params={"active_only": False}
    ).json()
    assert history[0]["status"] == "revoked"
    assert history[0]["revokedAt"] is not None
    assert client.get("/api/users/me", headers=pat_headers(raw_token)).status_code == 401


def test_independent_scopes_and_admin_suppression(
    client: TestClient,
    primary_headers: dict[str, str],
):
    assert client.post(
        "/api/users",
        headers=primary_headers,
        json={"username": "other", "password": "secret"},
    ).status_code == 201

    metadata_token = create_token(
        client, primary_headers, ["metadata:read"], name="Metadata only"
    )["token"]
    read_token = create_token(
        client, primary_headers, ["flights:read"], name="Flight reader"
    )["token"]
    create_only_token = create_token(
        client, primary_headers, ["flights:create"], name="Flight creator"
    )["token"]
    write_token = create_token(
        client, primary_headers, ["flights:write"], name="Flight editor"
    )["token"]

    assert client.get(
        "/api/airports", headers=pat_headers(metadata_token), params={"q": "JFK"}
    ).status_code == 200
    assert client.get("/api/users", headers=pat_headers(metadata_token)).status_code == 200
    assert client.get("/api/users/me", headers=pat_headers(metadata_token)).status_code == 200
    assert client.get(
        "/api/users/other/details", headers=pat_headers(metadata_token)
    ).status_code == 403
    assert client.get("/api/flights", headers=pat_headers(metadata_token)).status_code == 403

    assert client.get("/api/flights", headers=pat_headers(read_token)).status_code == 200
    assert client.get("/api/flights", headers=pat_headers(write_token)).status_code == 403
    assert client.get(
        "/api/airports", headers=pat_headers(read_token), params={"q": "JFK"}
    ).status_code == 403

    flight = {
        "username": "admin",
        "date": "2026-07-31",
        "origin": "LSZH",
        "destination": "KJFK",
    }
    assert client.post(
        "/api/flights", headers=pat_headers(read_token), json=flight
    ).status_code == 403
    created = client.post(
        "/api/flights", headers=pat_headers(create_only_token), json=flight
    )
    assert created.status_code == 201
    flight_id = created.json()

    assert client.post(
        "/api/flights", headers=pat_headers(write_token), json=flight
    ).status_code == 403
    assert client.patch(
        "/api/flights",
        headers=pat_headers(create_only_token),
        params={"id": flight_id},
        json={"notes": "creation cannot edit"},
    ).status_code == 403
    assert client.patch(
        "/api/flights",
        headers=pat_headers(write_token),
        params={"id": flight_id},
        json={"notes": "edited"},
    ).status_code == 200

    other_flight = {**flight, "username": "other"}
    assert client.post(
        "/api/flights", headers=pat_headers(create_only_token), json=other_flight
    ).status_code == 403
    assert client.post(
        "/api/flights/connections", headers=pat_headers(write_token)
    ).status_code == 403
    assert client.delete(
        "/api/flights",
        headers=pat_headers(create_only_token),
        params={"id": flight_id},
    ).status_code == 403
    assert client.delete(
        "/api/flights",
        headers=pat_headers(write_token),
        params={"id": flight_id},
    ).status_code == 200


def test_expired_tokens_are_computed_and_filterable(
    client: TestClient,
    primary_headers: dict[str, str],
):
    created = create_token(client, primary_headers, ["flights:read"])
    database.execute_query(
        "UPDATE api_tokens SET expires_at = '2000-01-01 00:00:00' WHERE id = ?;",
        [created["id"]],
    )

    assert client.get("/api/tokens", headers=primary_headers).json() == []
    history = client.get(
        "/api/tokens", headers=primary_headers, params={"active_only": False}
    ).json()
    assert history[0]["status"] == "expired"
    assert client.get(
        "/api/users/me", headers=pat_headers(created["token"])
    ).status_code == 401


def test_token_creation_validation(
    client: TestClient,
    primary_headers: dict[str, str],
):
    for payload in (
        {"name": "", "scopes": ["flights:read"], "expiresInDays": 90},
        {"name": "No scopes", "scopes": [], "expiresInDays": 90},
        {"name": "Admin", "scopes": ["admin:read"], "expiresInDays": 90},
        {"name": "Bad expiry", "scopes": ["flights:read"], "expiresInDays": 7},
    ):
        response = client.post("/api/tokens", headers=primary_headers, json=payload)
        assert response.status_code == 422

    malformed = client.get(
        "/api/users/me",
        headers={"Authorization": "Bearer jl_pat_too-short"},
    )
    assert malformed.status_code == 401
