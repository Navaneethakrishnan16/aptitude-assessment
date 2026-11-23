from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, verify_password
from app.database import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminLogin, Token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token({"sub": str(admin.id)})
    return Token(access_token=token)
