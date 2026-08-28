import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATA_PATH", tempfile.mkdtemp(prefix="jetlog-tests-"))
os.environ.setdefault("SECRET_KEY", "jetlog-test-secret")
os.environ.setdefault("TOKEN_DURATION", "7")
os.environ.setdefault("ENABLE_EXTERNAL_APIS", "false")
repository_root = Path(__file__).parent.parent
sys.path.insert(0, str(repository_root))
sys.path.insert(0, str(repository_root / "server"))

from server.database import database
from server.main import app


@pytest.fixture()
def client():
    database.execute_query("DELETE FROM api_tokens;")
    database.execute_query("DELETE FROM flights;")
    database.execute_query("DELETE FROM users WHERE username != 'admin';")
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def primary_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/token",
        data={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
