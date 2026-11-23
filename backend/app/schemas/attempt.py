from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: Optional[str] = None  # None = unattempted


class TestSubmit(BaseModel):
    attempt_id: int
    answers: List[AnswerSubmit]
    time_taken_seconds: int


class AttemptResult(BaseModel):
    attempt_id: int
    candidate_name: str
    score: float
    percentage: float
    correct_count: int
    incorrect_count: int
    unattempted_count: int
    marks_deducted: float
    time_taken_seconds: int
    status: str


class AttemptListItem(BaseModel):
    attempt_id: int
    full_name: str
    email: str
    phone: str
    age: int
    score: Optional[float]
    percentage: Optional[float]
    status: Optional[str]
    submitted_at: Optional[datetime]

    model_config = {"from_attributes": True}
