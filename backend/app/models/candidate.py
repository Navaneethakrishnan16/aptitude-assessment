from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    phone = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    qualification = Column(String, nullable=False)
    city = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
