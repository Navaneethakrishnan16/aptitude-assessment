from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionOut, QuestionUpdate

router = APIRouter(prefix="/api/admin/questions", tags=["admin-questions"])

MAX_ACTIVE_QUESTIONS = 10


@router.get("", response_model=List[QuestionOut])
def list_questions(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    return db.query(Question).all()


@router.post("", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    if payload.is_active:
        active_count = db.query(Question).filter(Question.is_active == True).count()  # noqa: E712
        if active_count >= MAX_ACTIVE_QUESTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot have more than {MAX_ACTIVE_QUESTIONS} active questions.",
            )
    question = Question(**payload.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    update_data = payload.model_dump(exclude_unset=True)

    will_be_active = update_data.get("is_active", question.is_active)
    if will_be_active and not question.is_active:
        active_count = db.query(Question).filter(Question.is_active == True).count()  # noqa: E712
        if active_count >= MAX_ACTIVE_QUESTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot have more than {MAX_ACTIVE_QUESTIONS} active questions.",
            )

    for field, value in update_data.items():
        setattr(question, field, value)

    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
