import jwt

from server.auth.auth import ALGORITHM, create_access_token
from server.auth.utils import hash_password, verify_password
from server.environment import SECRET_KEY


def test_password_hash_round_trip():
    password_hash = hash_password("correct horse battery staple")

    assert password_hash != "correct horse battery staple"
    assert verify_password("correct horse battery staple", password_hash)
    assert not verify_password("incorrect", password_hash)


def test_access_token_identifies_user():
    token = create_access_token({"sub": "test-user"})

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "test-user"
    assert "exp" in payload
