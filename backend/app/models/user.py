from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, nullable=False)
    password = Column(Text, nullable=False)
    role = Column(String, default="user")
    bio = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    avatar = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    skills = relationship("UserSkill", back_populates="user")