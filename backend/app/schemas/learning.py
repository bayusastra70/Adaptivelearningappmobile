from pydantic import BaseModel
from typing import List, Optional

class StepSchema(BaseModel):
    step_number: int
    title: string
    content: string

class LearningPathResponse(BaseModel):
    id: int
    skill_id: int
    title: str
    ai_summary: Optional[str]
    steps: List[StepSchema]

    class Config:
        from_attributes = True

class ProgressResponse(BaseModel):
    path_id: int
    title: str
    total_steps: int
    completed_steps: int
    progress_percentage: float

    class Config:
        from_attributes = True