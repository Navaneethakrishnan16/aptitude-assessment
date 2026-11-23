from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models.settings import TestSettings
from app.schemas.settings import SettingsOut, SettingsUpdate
from app.routers.tests import get_or_create_settings

router = APIRouter(tags=["settings"])


@router.get("/api/settings", response_model=SettingsOut)
def read_settings(db: Session = Depends(get_db)):
    """Public — the instructions page needs the current duration/pass % before login."""
    return get_or_create_settings(db)


@router.put("/api/admin/settings", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    s = get_or_create_settings(db)
    s.test_duration_minutes = payload.test_duration_minutes
    s.pass_percentage = payload.pass_percentage
    db.commit()
    db.refresh(s)
    return s
