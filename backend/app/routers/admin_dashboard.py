import io
from datetime import datetime
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_admin
from app.database import get_db
from app.models.candidate import Candidate
from app.models.attempt import Attempt, AttemptAnswer

router = APIRouter(prefix="/api/admin", tags=["admin-dashboard"])


def _completed_attempts_query(db: Session):
    return db.query(Attempt).filter(Attempt.submitted_at.isnot(None))


@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    total_candidates = db.query(Candidate).count()
    completed = _completed_attempts_query(db)
    tests_completed = completed.count()
    avg_score = db.query(func.avg(Attempt.percentage)).filter(Attempt.submitted_at.isnot(None)).scalar() or 0
    pass_count = completed.filter(Attempt.status == "Pass").count()
    pass_rate = (pass_count / tests_completed * 100) if tests_completed else 0
    highest_score = db.query(func.max(Attempt.score)).filter(Attempt.submitted_at.isnot(None)).scalar() or 0

    return {
        "total_candidates": total_candidates,
        "tests_completed": tests_completed,
        "average_percentage": round(avg_score, 2),
        "pass_rate": round(pass_rate, 2),
        "highest_score": highest_score,
    }


@router.get("/dashboard/chart")
def dashboard_chart(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    pass_count = _completed_attempts_query(db).filter(Attempt.status == "Pass").count()
    fail_count = _completed_attempts_query(db).filter(Attempt.status == "Fail").count()
    return {"pass_count": pass_count, "fail_count": fail_count}


@router.get("/results")
def list_results(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
    search: Optional[str] = Query(None, description="Search by name or email"),
    status_filter: Optional[str] = Query(None, alias="status", description="Pass or Fail"),
    sort_by: str = Query("date", pattern="^(score|date)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    query = (
        db.query(Attempt)
        .join(Candidate)
        .filter(Attempt.submitted_at.isnot(None))
        .options(joinedload(Attempt.candidate))
    )

    if search:
        like = f"%{search}%"
        query = query.filter(or_(Candidate.full_name.ilike(like), Candidate.email.ilike(like)))

    if status_filter:
        query = query.filter(Attempt.status == status_filter.capitalize())

    sort_column = Attempt.score if sort_by == "score" else Attempt.submitted_at
    sort_column = sort_column.desc() if sort_dir == "desc" else sort_column.asc()
    query = query.order_by(sort_column)

    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        {
            "attempt_id": a.id,
            "full_name": a.candidate.full_name,
            "email": a.candidate.email,
            "phone": a.candidate.phone,
            "age": a.candidate.age,
            "score": a.score,
            "percentage": a.percentage,
            "status": a.status,
            "submitted_at": a.submitted_at,
        }
        for a in rows
    ]

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/results/{attempt_id}")
def result_detail(attempt_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    attempt = (
        db.query(Attempt)
        .filter(Attempt.id == attempt_id)
        .options(joinedload(Attempt.candidate), joinedload(Attempt.answers).joinedload(AttemptAnswer.question))
        .first()
    )
    if not attempt or attempt.submitted_at is None:
        raise HTTPException(status_code=404, detail="Result not found")

    answers = sorted(attempt.answers, key=lambda a: a.question_order)
    return {
        "candidate": {
            "full_name": attempt.candidate.full_name,
            "email": attempt.candidate.email,
            "phone": attempt.candidate.phone,
            "age": attempt.candidate.age,
        },
        "summary": {
            "score": attempt.score,
            "percentage": attempt.percentage,
            "correct_count": attempt.correct_count,
            "incorrect_count": attempt.incorrect_count,
            "unattempted_count": attempt.unattempted_count,
            "status": attempt.status,
            "time_taken_seconds": attempt.time_taken_seconds,
        },
        "questions": [
            {
                "question_text": a.question.text,
                "options": {
                    "A": a.question.option_a,
                    "B": a.question.option_b,
                    "C": a.question.option_c,
                    "D": a.question.option_d,
                },
                "candidate_answer": a.selected_option,
                "correct_answer": a.question.correct_option,
                "is_correct": a.is_correct,
            }
            for a in answers
        ],
    }


@router.get("/results/export/csv")
def export_results_csv(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    query = (
        db.query(Attempt)
        .join(Candidate)
        .filter(Attempt.submitted_at.isnot(None))
        .options(joinedload(Attempt.candidate))
    )
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Candidate.full_name.ilike(like), Candidate.email.ilike(like)))
    if status_filter:
        query = query.filter(Attempt.status == status_filter.capitalize())

    rows = query.order_by(Attempt.submitted_at.desc()).all()

    data = [
        {
            "Name": a.candidate.full_name,
            "Email": a.candidate.email,
            "Phone": a.candidate.phone,
            "Age": a.candidate.age,
            "Score": a.score,
            "Percentage": a.percentage,
            "Status": a.status,
            "Date of Attempt": a.submitted_at.strftime("%Y-%m-%d %H:%M") if a.submitted_at else "",
        }
        for a in rows
    ]
    df = pd.DataFrame(data)
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    filename = f"candidate_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
