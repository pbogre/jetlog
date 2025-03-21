from server.models import CustomModel, User
from server.database import database
from server.auth.utils import hash_password, get_user, oauth2_scheme
from server.environment import SECRET_KEY, AUTH_HEADER


import jwt
from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter(
    prefix="/users",
    tags=["users"],
    redirect_slashes=True
)

class UserPatch(CustomModel):
    username: str|None = None
    password: str|None = None
    is_admin: bool|None = None

ALGORITHM = "HS256"

async def get_user_from_auth_header(request: Request) -> User:
    """
    Authenticate users via AUTH_HEADER.
    Automatically creates the user if they do not exist.
    """
    header_username = request.headers.get(AUTH_HEADER)

    if not header_username:
        raise HTTPException(status_code=401, detail="Missing authentication header")

    user = get_user(header_username)

    if not user:
        raise HTTPException(status_code=403, detail="Username supplied in header does not exist, please have your instance admin create this user.")

    return user

async def get_user_from_token(token: str = Depends(oauth2_scheme)) -> User:
    """
    Authenticate users via OAuth2 token.
    """
    credentials_exception = HTTPException(
        status_code=401,
        headers={"WWW-Authenticate": "Bearer"},
        detail="Invalid token"
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = get_user(username)
    if user is None:
        raise credentials_exception

    return user

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)) -> User:
    """
    Use Auth Header if present, otherwise fallback to OAuth2 token.
    """
    if AUTH_HEADER in request.headers:
        return await get_user_from_auth_header(request)

    return await get_user_from_token(token)

@router.get("/me")
async def get_current_user_route(user: User = Depends(get_current_user)) -> User:
    """
    Returns the current authenticated user.
    Automatically authenticates via AUTH_HEADER if available.
    """
    return user

@router.post("", status_code=201)
async def create_user(new_user: UserPatch, user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create new users")
    if not new_user.username or not new_user.password:
        raise HTTPException(status_code=400, detail="Username and password are required fields")
    if len(new_user.username) < 1:
        raise HTTPException(status_code=400, detail="Username should be at least 1 character long")

    password_hash = hash_password(new_user.password)
    is_admin = new_user.is_admin if new_user.is_admin is not None else False
    database.execute_query(
        "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
        [new_user.username, password_hash, is_admin]
    )

@router.get("")
async def get_users(_: User = Depends(get_current_user)) -> list[str]:
    res = database.execute_read_query("SELECT username FROM users;")

    usernames = [ entry[0] for entry in res ]

    return usernames

@router.get("/{username}/details")
async def get_user_details(username: str, user: User = Depends(get_current_user)) -> User:
    if user.username != username and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can get other users' details")

    found_user = get_user(username)
    if found_user is None:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    return found_user

@router.patch("/{username}", status_code=200)
async def update_user(username: str, new_user: UserPatch, user: User = Depends(get_current_user)):
    if user.username != username and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can edit other users")
    if new_user.is_admin and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can set users as admins")
    if new_user.is_admin and username == user.username:
        raise HTTPException(status_code=403, detail="You may only change the admin status of other users")

    query = "UPDATE users SET "
    values = []

    for attr in UserPatch.get_attributes():
        value = getattr(new_user, attr)
        if value is None:
            continue
        if attr == "password":
            value = hash_password(value)
            attr = "password_hash"

        query += f"{attr}=?,"
        values.append(value)

    if query[-1] == ',':
        query = query[:-1]

    query += " WHERE username = ?;"
    values.append(username)
    database.execute_query(query, values)

    # If username was edited, update all flights of that user
    if new_user.username:
        database.execute_query(
            "UPDATE flights SET username = ? WHERE username = ?;",
            [new_user.username, username]
        )

@router.delete("/{username}", status_code=200)
async def delete_user(username: str, user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    if username == user.username:
        raise HTTPException(status_code=400, detail="You cannot delete your own user")

    database.execute_query("DELETE FROM flights WHERE username = ?;", [username])
    database.execute_query("DELETE FROM users WHERE username = ?;", [username])
