from server.models import User

from fastapi.security import OAuth2PasswordBearer
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)
_ph = PasswordHasher()

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _ph.verify(password_hash, password)
    except VerificationError:
        return False

def hash_password(password: str) -> str:
    password_hash = _ph.hash(password)
    return password_hash

def get_user(username: str) -> User|None:
    from server.database import database

    result = database.execute_read_query(f"SELECT * FROM users WHERE username = ?;", [username])

    if not result:
        return None

    user = User.from_database(result[0])
    return User.model_validate(user)

def get_user_by_id(user_id: int) -> User|None:
    from server.database import database

    result = database.execute_read_query("SELECT * FROM users WHERE id = ?;", [user_id])

    if not result:
        return None

    user = User.from_database(result[0])
    return User.model_validate(user)
