import datetime

from server.models import CustomModel, User
from server.database import database
from server.auth.context import METADATA_READ
from server.auth.dependencies import (
    require_primary_auth,
    require_scope,
)
from server.auth.utils import hash_password, get_user


from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(
    prefix="/users",
    tags=["users"],
    redirect_slashes=True
)

class UserPatch(CustomModel):
    username: str|None = None
    password: str|None = None
    is_admin: bool|None = None

class UserPublic(CustomModel):
    id:         int
    username:   str
    is_admin:   bool
    last_login: datetime.datetime|None
    created_on: datetime.datetime

    @classmethod
    def from_user(cls, user: User) -> "UserPublic":
        return cls(
            id=user.id,
            username=user.username,
            is_admin=user.is_admin,
            last_login=user.last_login,
            created_on=user.created_on
        )

@router.get("/me", response_model=UserPublic)
async def get_me(
    user: User = Depends(require_scope(METADATA_READ))
) -> UserPublic:
    return UserPublic.from_user(user)

@router.post("", status_code=201)
async def create_user(
    new_user: UserPatch,
    user: User = Depends(require_primary_auth)
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create new users")
    if not new_user.username or not new_user.password:
        raise HTTPException(status_code=400, detail="Username and password are required fields")
    if len(new_user.username) < 1:
        raise HTTPException(status_code=400, detail="Username should be at least 1 character long")

    password_hash = hash_password(new_user.password)
    is_admin = new_user.is_admin if new_user.is_admin != None else False
    database.execute_query("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
                           [new_user.username, password_hash, is_admin]
    )

@router.get("")
async def get_users(_: User = Depends(require_scope(METADATA_READ))) -> list[str]:
    res = database.execute_read_query("SELECT username FROM users;")
    usernames = [ entry[0] for entry in res ]

    return usernames

@router.get("/{username}/details", response_model=UserPublic)
async def get_user_details(
    username: str,
    user: User = Depends(require_primary_auth)
) -> UserPublic:
    if user.username != username and not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can get other users' details")

    found_user = get_user(username)
    if found_user == None:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")

    return UserPublic.from_user(found_user)

@router.patch("/{username}", status_code=200)
async def update_user(
    username: str,
    new_user: UserPatch,
    user: User = Depends(require_primary_auth)
):
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
        if value == None:
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

    # if username was edited, update all flights of that user
    if new_user.username:
        database.execute_query(
            "UPDATE flights SET username = ? WHERE username = ?;",
            [new_user.username, username]
        )

@router.delete("/{username}", status_code=200)
async def delete_user(
    username: str,
    user: User = Depends(require_primary_auth)
):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    if username == user.username:
        raise HTTPException(status_code=400, detail="You cannot delete your own user")

    database.execute_query("DELETE FROM flights WHERE username = ?;", [username])
    database.execute_query("DELETE FROM users WHERE username = ?;", [username])
