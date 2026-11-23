from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.attempt import Attempt
from app.schemas.candidate import CandidateCreate, CandidateOut

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.post("", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def register_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    existing = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if existing:
        already_attempted = db.query(Attempt).filter(Attempt.candidate_id == existing.id).first()
        if already_attempted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email has already taken the test. Only one attempt is allowed per email.",
            )
        return existing  # registered but hasn't started a test yet — let them continue

    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate
