import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from core.database import get_db
from models.skill import Skill
from models.learning import LearningPath, LearningStep, UserProgress
from routes.auth import get_current_user

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    generation_config={"temperature": 0.7, "response_mime_type": "application/json"}
)

router = APIRouter(prefix="/learning", tags=["Learning AI"])

@router.post("/generate/{skill_id}")
async def generate_learning_path(
    skill_id: int, 
    user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    user_id = user["sub"]
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill tidak ditemukan")

    # 1. Cek Data Lama
    existing_path = db.query(LearningPath).filter(
        LearningPath.user_id == user_id, 
        LearningPath.skill_id == skill_id
    ).options(joinedload(LearningPath.steps)).first()

    if existing_path:
        steps_with_progress = []
        for s in sorted(existing_path.steps, key=lambda x: x.step_number):
            progress = db.query(UserProgress).filter(
                UserProgress.user_id == user_id, 
                UserProgress.step_id == s.id
            ).first()
            steps_with_progress.append({
                "id": s.id, "step_number": s.step_number,
                "title": s.title, "content": s.content,
                "is_completed": progress.is_completed if progress else False
            })
        return {"id": existing_path.id, "title": existing_path.title, "steps": steps_with_progress}

    # 2. Generate Data (AI atau Fallback)
    ai_data = None
    try:
        # PROMPT YANG LEBIH DETIL
        prompt = f"""
        Buatkan panduan belajar intensif untuk skill '{skill.name}'.
        Berikan 5 langkah yang sangat teknis dan informatif. 
        Jangan berikan penjelasan singkat, tapi berikan instruksi langkah-demi-langkah (minimal 4 kalimat per langkah).
        
        Respon HANYA dalam format JSON:
        {{
          "title": "Mastering {skill.name}",
          "summary": "Kurikulum komprehensif untuk penguasaan {skill.name}.",
          "steps": [
            {{
              "step_number": 1, 
              "title": "Setup & Fondasi", 
              "content": "Instruksi detil cara mulai, tools yang diinstall, dan konsep awal yang harus dipahami..."
            }}
          ]
        }}
        Gunakan Bahasa Indonesia.
        """
        response = model.generate_content(prompt)
        res_text = response.text.strip()
        if "```" in res_text:
            res_text = res_text.split("```")[1].replace("json", "").strip()
        ai_data = json.loads(res_text)
    except Exception:
        # FALLBACK JIKA AI ERROR / KUOTA HABIS
        ai_data = {
            "title": f"Panduan {skill.name}",
            "summary": "Kurikulum standar.",
            "steps": [
                {"step_number": 1, "title": "Pengenalan Dasar", "content": f"Pelajari apa itu {skill.name}, sejarahnya, dan mengapa skill ini penting di industri saat ini. Fokus pada terminologi dasar."},
                {"step_number": 2, "title": "Persiapan Lingkungan", "content": "Download dan install kode editor seperti VS Code. Konfigurasi semua plugin yang dibutuhkan agar proses koding lebih efisien."},
                {"step_number": 3, "title": "Sintaks Utama", "content": "Pelajari cara menulis variabel, fungsi, dan struktur kontrol. Cobalah membuat program kecil untuk melatih logika dasar."},
                {"step_number": 4, "title": "Best Practices", "content": "Mulai terapkan standar penulisan kode yang bersih (clean code) dan pelajari cara melakukan debugging jika terjadi error."},
                {"step_number": 5, "title": "Mini Project", "content": "Gabungkan semua yang telah dipelajari untuk membuat satu project nyata yang bisa dipamerkan di portfolio kamu."}
            ]
        }

    # 3. Simpan ke Database
    try:
        new_path = LearningPath(
            user_id=user_id, skill_id=skill_id,
            title=ai_data['title'], ai_summary=ai_data.get('summary', "")
        )
        db.add(new_path)
        db.commit()
        db.refresh(new_path)

        final_steps = []
        for s in ai_data['steps']:
            new_step = LearningStep(
                path_id=new_path.id, step_number=s['step_number'],
                title=s['title'], content=s['content']
            )
            db.add(new_step)
            db.commit()
            db.refresh(new_step)

            db.add(UserProgress(user_id=user_id, step_id=new_step.id, is_completed=False))
            final_steps.append({**s, "id": new_step.id, "is_completed": False})
        
        db.commit()
        return {**ai_data, "id": new_path.id, "steps": final_steps}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ENDPOINT BARU UNTUK CEKLIS
@router.patch("/step/{step_id}/complete")
async def toggle_step(step_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user["sub"], 
        UserProgress.step_id == step_id
    ).first()
    if progress:
        progress.is_completed = not progress.is_completed
        db.commit()
        return {"is_completed": progress.is_completed}
    raise HTTPException(status_code=404, detail="Data tidak ditemukan")

@router.get("/my-progress")
async def get_all_progress(user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = user["sub"]
    
    # Ambil semua path yang dimiliki user
    paths = db.query(LearningPath).filter(LearningPath.user_id == user_id).all()
    
    result = []
    for path in paths:
        total_steps = len(path.steps)
        # Hitung berapa yang sudah is_completed = True
        completed_count = db.query(UserProgress).join(LearningStep).filter(
            LearningStep.path_id == path.id,
            UserProgress.user_id == user_id,
            UserProgress.is_completed == True
        ).count()
        
        progress_percent = (completed_count / total_steps * 100) if total_steps > 0 else 0
        
        result.append({
            "path_id": path.id,
            "title": path.title,
            "total_steps": total_steps,
            "completed_steps": completed_count,
            "progress_percentage": round(progress_percent, 2)
        })
        
    return result

@router.post("/step/{step_id}/ask-ai")
async def ask_step_ai(step_id: int, payload: dict, db: Session = Depends(get_db)):
    user_question = payload.get("question")
    step = db.query(LearningStep).filter(LearningStep.id == step_id).first()
    
    if not step:
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan")

    # Prompt dengan Konteks (Contextual Prompting)
    prompt = f"""
    Kamu adalah tutor ahli. User sedang mempelajari materi: "{step.title}"
    Isi materi tersebut adalah: "{step.content}"
    
    User bertanya: "{user_question}"
    
    Tolong jelaskan jawabanmu dengan bahasa yang sederhana, mudah dimengerti, dan tetap fokus pada konteks materi di atas.
    """
    
    # Panggil fungsi Gemini kamu di sini
    # response = call_gemini(prompt)
    # return {"answer": response}
    
    # Dummy response untuk testing UI
    return {"answer": f"Tentu! Mengenai '{user_question}' dalam konteks {step.title}, intinya adalah..."}