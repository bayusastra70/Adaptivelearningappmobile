from pydantic import BaseModel
from typing import Optional

class UpdateProfileSchema(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None