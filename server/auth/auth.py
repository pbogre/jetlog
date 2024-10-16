from server.models import CustomModel, User
from server.database import database
from server.auth.utils import hash_password, verify_password, oauth2_scheme

import jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    redirect_slashes=True
)

# CRITICAL SAFETY WARNING: 
# this variable was set here for testin purposes ONLY,
# in a production environment, this HAS to be changed
# to be entered by the user as an argument!!!
SECRET_KEY = "ad9df50bddc30ac206cd203a511285341b482d5e24f64c43579d4ade4d3b54fc"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    
    # set expiration
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(username: str) -> User|None:
    result = database.execute_read_query(f"SELECT * FROM users WHERE username = ?;", [username])
 
    if not result:
        return None

    user = User.from_database(result[0])
    return User.model_validate(user)

def update_last_login(username: str) -> None:
    database.execute_query(f"""UPDATE users
                               SET last_login = current_timestamp
                               WHERE username = ?;""", [username])

@router.post("/token", status_code=200)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, 
                            headers={"WWW-Authenticate": "Bearer"},
                            detail="Incorrect username or password")

    update_last_login(user.username)

    access_token = create_access_token({"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/users/me")
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
            detail="Invalid token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if username == None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = get_user(username)

    if user == None:
        raise credentials_exception

    return user

@router.get("/users/{username}")
async def get_specific_user(username: str, user: User = Depends(get_current_user)) -> User:
    if user.username != username and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can get other users' details")

    found_user = get_user(username)
    if found_user is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    return found_user
    
@router.get("/users")
async def get_all_usernames(user: User = Depends(get_current_user)) -> list[str]:
    res = database.execute_read_query("SELECT username FROM users;")
    usernames = [username[0] for username in res]
    return usernames

@router.post("/users", status_code=201)
async def create_user(username: str, password: str, user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins change create new users")

    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username should be at least 3 characters long")

    password_hash = hash_password(password)
    database.execute_query(f"INSERT INTO users (username, password_hash) VALUES (?, ?)",
                           [username, password_hash])

class UserPatch(CustomModel):
    username: str|None = None
    password: str|None = None
    is_admin: bool|None = None

@router.patch("/users/{username}", status_code=200)
async def update_user(username: str, new_user: UserPatch, user: User = Depends(get_current_user)):
    if user.username != username and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can edit other users")
    if new_user.is_admin and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can users admin")
    if new_user.is_admin and username == user.username:
        raise HTTPException(status_code=403, detail="You may only change the admin status of other users")

    query = "UPDATE users SET "

    values = []
    for attr in UserPatch.get_attributes():
        value = getattr(new_user, attr)

        if not value:
            continue

        if attr == "password":
            value = hash_password(value)
            attr = "password_hash"

        query += f"{attr}=?,"
        values.append(value)

    if query[-1] == ',':
        query = query[:-1]

    query += f" WHERE username = '{username}';"
    database.execute_query(query, values)
