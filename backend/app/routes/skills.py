from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User  
from models.skill import Skill, UserSkill
from routes.auth import get_current_user
from schemas.skill import SkillCreate 


router = APIRouter(prefix="/skills", tags=["Skills"])

@router.get("/")
async def get_all_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()

@router.post("/my-skills")
async def add_my_skill(
    payload: SkillCreate, # Gunakan Schema sebagai body
    user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    
    # Validasi: Gunakan payload.skill_id
    skill_exists = db.query(Skill).filter(Skill.id == payload.skill_id).first()
    if not skill_exists:
        raise HTTPException(status_code=404, detail="Skill tidak ditemukan")

    # Cek duplikasi
    existing = db.query(UserSkill).filter(
        UserSkill.user_id == user_id, 
        UserSkill.skill_id == payload.skill_id
    ).first()
    
    if existing:
        return {"message": "Skill sudah ada di profil kamu"}

    # Gunakan payload.skill_id dan payload.level
    new_user_skill = UserSkill(
        user_id=user_id, 
        skill_id=payload.skill_id, 
        level=payload.level
    )
    db.add(new_user_skill)
    db.commit()
    return {"message": f"Skill {skill_exists.name} berhasil ditambahkan"}

@router.get("/my-skills")
def get_my_skills(user=Depends(get_current_user), db: Session = Depends(get_db)):
    skills = db.query(UserSkill).filter(UserSkill.user_id == user["sub"]).all()
    return [
        {"id": s.skill.id, "name": s.skill.name, "level": s.level}
        for s in skills
    ]

@router.post("/seed")
async def seed_skills(db: Session = Depends(get_db)):
    if db.query(Skill).first():
        return {"message": "Database sudah memiliki data skill"}

    sample_skills = [
        Skill(name="Mobile Development", description="Membangun aplikasi Android/iOS"),
        Skill(name="Backend Development", description="Membangun API dengan Python/FastAPI"),
        Skill(name="UI/UX Design", description="Merancang antarmuka pengguna yang cantik"),
        Skill(name="Data Science", description="Mengolah data menjadi informasi"),
    ]
    db.add_all(sample_skills)
    db.commit()
    return {"message": "4 Skill awal berhasil ditambahkan!"}