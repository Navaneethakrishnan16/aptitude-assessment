import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.candidate import Candidate
from app.models.question import Question
from app.models.attempt import Attempt, AttemptAnswer
from app.models.settings import TestSettings
from app.schemas.question import QuestionPublic
from app.schemas.attempt import TestSubmit, AttemptResult

router = APIRouter(prefix="/api/tests", tags=["tests"])

REQUIRED_QUESTION_COUNT = 10
MARKS_CORRECT = 2
MARKS_WRONG = -1


def get_or_create_settings(db: Session) -> TestSettings:
    s = db.query(TestSettings).first()
    if not s:
        s = TestSettings(test_duration_minutes=15, pass_percentage=60.0)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.post("/start/{candidate_id}")
def start_test(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing_attempt = db.query(Attempt).filter(Attempt.candidate_id == candidate_id).first()
    if existing_attempt and existing_attempt.submitted_at is not None:
        raise HTTPException(status_code=409, detail="You have already completed this test.")

    settings_row = get_or_create_settings(db)

    if existing_attempt:
        # resume an in-progress attempt (e.g. after refresh) rather than reshuffling
        attempt = existing_attempt
        answers = (
            db.query(AttemptAnswer)
            .filter(AttemptAnswer.attempt_id == attempt.id)
            .order_by(AttemptAnswer.question_order)
            .options(joinedload(AttemptAnswer.question))
            .all()
        )
    else:
        active_questions = db.query(Question).filter(Question.is_active == True).all()  # noqa: E712
        if len(active_questions) < REQUIRED_QUESTION_COUNT:
            raise HTTPException(
                status_code=400,
                detail=f"Test unavailable: only {len(active_questions)} active questions configured, need {REQUIRED_QUESTION_COUNT}.",
            )
        selected = random.sample(active_questions, REQUIRED_QUESTION_COUNT)

        attempt = Attempt(candidate_id=candidate_id)
        db.add(attempt)
        db.flush()  # get attempt.id without committing yet

        answers = []
        for order, q in enumerate(selected):
            aa = AttemptAnswer(attempt_id=attempt.id, question_id=q.id, question_order=order)
            db.add(aa)
            answers.append(aa)
        db.commit()
        db.refresh(attempt)
        for aa in answers:
            db.refresh(aa)

    questions_out = [QuestionPublic.model_validate(a.question) for a in answers]

    return {
        "attempt_id": attempt.id,
        "duration_minutes": settings_row.test_duration_minutes,
        "pass_percentage": settings_row.pass_percentage,
        "marking_scheme": {"correct": MARKS_CORRECT, "wrong": MARKS_WRONG, "unattempted": 0},
        "questions": questions_out,
    }


@router.post("/submit", response_model=AttemptResult)
def submit_test(payload: TestSubmit, db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == payload.attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.submitted_at is not None:
        raise HTTPException(status_code=409, detail="This attempt has already been submitted.")

    answer_map = {a.question_id: a.selected_option for a in payload.answers}

    attempt_answers = (
        db.query(AttemptAnswer)
        .filter(AttemptAnswer.attempt_id == attempt.id)
        .options(joinedload(AttemptAnswer.question))
        .order_by(AttemptAnswer.question_order)
        .all()
    )

    correct = incorrect = unattempted = 0
    score = 0.0

    for aa in attempt_answers:
        selected = answer_map.get(aa.question_id)
        aa.selected_option = selected
        if not selected:
            unattempted += 1
            aa.is_correct = None
            continue
        is_correct = selected.strip().upper() == aa.question.correct_option
        aa.is_correct = is_correct
        if is_correct:
            correct += 1
            score += MARKS_CORRECT
        else:
            incorrect += 1
            score += MARKS_WRONG

    max_possible = len(attempt_answers) * MARKS_CORRECT  # 20 for 10 questions at +2 each
    percentage = (score / max_possible) * 100 if max_possible else 0

    settings_row = get_or_create_settings(db)
    result_status = "Pass" if percentage >= settings_row.pass_percentage else "Fail"

    attempt.score = score
    attempt.percentage = round(percentage, 2)
    attempt.correct_count = correct
    attempt.incorrect_count = incorrect
    attempt.unattempted_count = unattempted
    attempt.marks_deducted = incorrect * abs(MARKS_WRONG)
    attempt.time_taken_seconds = payload.time_taken_seconds
    attempt.status = result_status
    attempt.submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(attempt)

    return AttemptResult(
        attempt_id=attempt.id,
        candidate_name=attempt.candidate.full_name,
        score=attempt.score,
        percentage=attempt.percentage,
        correct_count=attempt.correct_count,
        incorrect_count=attempt.incorrect_count,
        unattempted_count=attempt.unattempted_count,
        marks_deducted=attempt.marks_deducted,
        time_taken_seconds=attempt.time_taken_seconds,
        status=attempt.status,
    )


@router.get("/result/{attempt_id}", response_model=AttemptResult)
def get_result(attempt_id: int, db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt or attempt.submitted_at is None:
        raise HTTPException(status_code=404, detail="Result not available")
    return AttemptResult(
        attempt_id=attempt.id,
        candidate_name=attempt.candidate.full_name,
        score=attempt.score,
        percentage=attempt.percentage,
        correct_count=attempt.correct_count,
        incorrect_count=attempt.incorrect_count,
        unattempted_count=attempt.unattempted_count,
        marks_deducted=attempt.marks_deducted,
        time_taken_seconds=attempt.time_taken_seconds,
        status=attempt.status,
    )
