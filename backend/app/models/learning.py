from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from core.database import Base
from sqlalchemy.orm import relationship

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    title = Column(String(150))
    ai_summary = Column(Text)

    # Hubungan ke steps
    steps = relationship("LearningStep", back_populates="path", cascade="all, delete-orphan")

class LearningStep(Base):
    __tablename__ = "learning_steps"

    id = Column(Integer, primary_key=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id"))
    step_number = Column(Integer)
    title = Column(String(150))
    content = Column(Text)

    # Hubungan balik ke path
    path = relationship("LearningPath", back_populates="steps")
    # Hubungan ke progress
    progress = relationship("UserProgress", back_populates="step", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    step_id = Column(Integer, ForeignKey("learning_steps.id"))
    is_completed = Column(Boolean, default=False)

    # Hubungan balik ke step
    step = relationship("LearningStep", back_populates="progress")