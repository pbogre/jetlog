from server.environment import PATH_PREFIX
assert type(PATH_PREFIX) == str # for linter
from server.models import User

from fastapi.security import OAuth2PasswordBearer
from argon2 import PasswordHasher

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=PATH_PREFIX + "/api/auth/token", auto_error=False)
_ph = PasswordHasher()

def verify_password(password: str, password_hash: str) -> bool:
    return _ph.verify(password_hash, password)

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
