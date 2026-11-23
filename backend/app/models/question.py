import enum

from sqlalchemy import Column, Integer, String, Boolean, Enum

from app.database import Base


class Category(str, enum.Enum):
    QUANTITATIVE = "Quantitative"
    LOGICAL_REASONING = "Logical Reasoning"
    VERBAL = "Verbal"


class Difficulty(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)  # "A" | "B" | "C" | "D"
    category = Column(Enum(Category), nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
