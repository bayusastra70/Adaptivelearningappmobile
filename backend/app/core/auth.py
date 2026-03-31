from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

ACCESS_EXPIRE = 15
REFRESH_EXPIRE = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"])
security = HTTPBearer()

def hash_password(password: str):
    password_bytes = password.encode("utf-8")
    return pwd_context.hash(password_bytes[:72])

def verify_password(plain_password: str, hashed_password: str):
    password_bytes = plain_password.encode("utf-8")
    return pwd_context.verify(password_bytes[:72], hashed_password)

def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE)
    data.update({"exp": expire, "type": "access"})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_EXPIRE)
    data.update({"exp": expire, "type": "refresh"})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# JWT middleware
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401)

        return payload

    except JWTError:
        raise HTTPException(status_code=401)

# RBAC
def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")