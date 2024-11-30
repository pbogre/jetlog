from server.models import User

from fastapi.security import OAuth2PasswordBearer
import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def verify_password(password: str, password_hash: str) -> bool:
    password_bytes = password.encode('utf-8')
    password_hash_bytes = password_hash.encode('utf-8')
    return bcrypt.checkpw(password_bytes, password_hash_bytes)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    return password_hash

def get_user(username: str) -> User|None:
    from server.database import database

    result = database.execute_read_query(f"SELECT * FROM users WHERE username = ?;", [username])
 
    if not result:
        return None

    user = User.from_database(result[0])
    return User.model_validate(user)
