from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.question import Category, Difficulty


class QuestionBase(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    category: Category
    difficulty: Difficulty
    is_active: bool = True

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: str) -> str:
        v = v.upper().strip()
        if v not in {"A", "B", "C", "D"}:
            raise ValueError("correct_option must be one of A, B, C, D")
        return v


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    category: Optional[Category] = None
    difficulty: Optional[Difficulty] = None
    is_active: Optional[bool] = None


class QuestionOut(QuestionBase):
    id: int

    model_config = {"from_attributes": True}


class QuestionPublic(BaseModel):
    """Shape sent to candidates during the test — no correct_option leaked."""
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    model_config = {"from_attributes": True}
