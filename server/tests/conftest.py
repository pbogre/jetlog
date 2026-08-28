"""Test configuration.

The server reads DATA_PATH / SECRET_KEY / TOKEN_DURATION / AUTH_HEADER from the
environment at import time, so they are set here (before any server module is
imported) and point at a throwaway database created for the test run.
"""
import os
import sqlite3
import sys
import tempfile
from pathlib import Path

TEST_DATA_DIR = tempfile.mkdtemp(prefix="jetlog-test-")
os.environ["DATA_PATH"] = TEST_DATA_DIR
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["TOKEN_DURATION"] = "1440"
os.environ["AUTH_HEADER"] = "X-Test-User"
os.environ["ENABLE_EXTERNAL_APIS"] = "false"
os.environ["DEFAULT_LANGUAGE"] = "zh-CN"

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

import pytest
from fastapi.testclient import TestClient

from server.database import database

# TestClient serves requests from a different thread than the one that created
# the module-level sqlite connection, so allow cross-thread use for tests.
database.connection = sqlite3.connect(
    os.path.join(TEST_DATA_DIR, "jetlog.db"), check_same_thread=False
)
database.connection.execute("PRAGMA foreign_keys = ON;")

AUTH_HEADERS = {"X-Test-User": "admin"}


@pytest.fixture()
def client():
    from server.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _clean_flights():
    """Keep the shared test database isolated between tests."""
    yield
    database.execute_query("DELETE FROM flights;")
