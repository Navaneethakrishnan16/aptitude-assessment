from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, unique=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    unattempted_count = Column(Integer, default=0)
    marks_deducted = Column(Float, default=0)
    time_taken_seconds = Column(Integer, nullable=True)
    status = Column(String, nullable=True)  # "Pass" | "Fail"

    candidate = relationship("Candidate")
    answers = relationship("AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    question_order = Column(Integer, nullable=False)
    selected_option = Column(String, nullable=True)  # null = unattempted
    is_correct = Column(Boolean, nullable=True)

    attempt = relationship("Attempt", back_populates="answers")
    question = relationship("Question")
