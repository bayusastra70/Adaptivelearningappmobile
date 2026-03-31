from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from core.database import SessionLocal, get_db
from core.auth import get_current_user
from models import User
from schemas.user import UpdateProfileSchema
import os        
import shutil

router = APIRouter()

UPLOAD_DIR = "uploads"


@router.get("/profile")
async def profile(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user["sub"]).first()

    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "role": db_user.role,
        "bio": db_user.bio,
        "phone": db_user.phone,
        "avatar": db_user.avatar
    }

@router.put("/profile")
async def update_profile(
    data: UpdateProfileSchema,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.id == user["sub"]).first()

    if data.name is not None:
        db_user.name = data.name

    if data.bio is not None:
        db_user.bio = data.bio

    if data.phone is not None:
        db_user.phone = data.phone

    db.commit()

    return {"message": "profile updated"}

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Buat nama file unik berdasarkan ID User
    user_id = user.get("sub") or user.get("id") # Antisipasi perbedaan key token
    filename = f"user_{user_id}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)

    try:
        # Gunakan 'with' agar file handle tertutup otomatis setelah copy
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return {"error": f"Gagal menyimpan file: {str(e)}"}

    user_db = db.query(User).filter(User.id == user_id).first()
    if not user_db:
        return {"error": "User tidak ditemukan di database"}

    # Simpan path relatif ke DB
    user_db.avatar = f"http://192.168.1.14:8000/uploads/{filename}"
    db.commit()

    return {"avatar": user_db.avatar}



