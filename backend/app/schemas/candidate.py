import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    age: int
    phone: str
    gender: Optional[str] = None
    qualification: str
    city: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        # Changed from {2,50} to {3,50}
        if not re.fullmatch(r"[A-Za-z ]{3,50}", v):
            raise ValueError("Full name must be 3-50 characters, letters and spaces only")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        # Changed from 18-60 to 0-100
        if not (0 <= v <= 100):
            raise ValueError("Age must be between 0 and 100")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone number must be exactly 10 digits")
        return v

    @field_validator("qualification")
    @classmethod
    def validate_qualification(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Highest qualification is required")
        return v


class CandidateOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    age: int
    phone: str
    gender: Optional[str] = None
    qualification: str
    city: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}