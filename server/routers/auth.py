from pydantic import BaseModel
from server.database import database
from server.models import User

import jwt
from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    redirect_slashes=True
)

# CRITICAL SAFETY WARNING: 
# this variable was set here for testin purposes ONLY,
# in a production environment, this HAS to be changed
# to be entered by the user as an argument!!!
SECRET_KEY = "ad9df50bddc30ac206cd203a511285341b482d5e24f64c43579d4ade4d3b54fc"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    
    # set expiration
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user(username: str) -> User|None:
    result = database .execute_read_query(f"SELECT * FROM users WHERE username = {username};")
 
    if not result:
        return None

    user = User.from_database(result[0])
    return User.model_validate(user)

@router.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, 
                            headers={"WWW-Authenticate": "Bearer"},
                            detail="Incorrect username or password")

    access_token = create_access_token({"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")
