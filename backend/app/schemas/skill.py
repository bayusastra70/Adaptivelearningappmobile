from pydantic import BaseModel

class SkillCreate(BaseModel):
    skill_id: int
    level: int