from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import SessionLocal
from core.auth import *
from models import User
from schemas.auth import *

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =====================
# REGISTER
# =====================
@router.post("/register")
async def register(data: RegisterSchema, db: Session = Depends(get_db)):

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email exists")

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="user"
    )

    db.add(user)
    db.commit()

    return {"message": "registered"}


# =====================
# LOGIN
# =====================
@router.post("/login")
async def login(data: LoginSchema, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(401)

    payload = {"sub": str(user.id), "role": user.role}

    return {
        "access_token": create_access_token(payload),
        "refresh_token": create_refresh_token(payload)
    }


# =====================
# REFRESH
# =====================
@router.post("/refresh")
async def refresh(data: RefreshSchema):

    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "refresh":
            raise HTTPException(401)

        return {
            "access_token": create_access_token({
                "sub": payload["sub"],
                "role": payload["role"]
            })
        }

    except JWTError:
        raise HTTPException(401)

