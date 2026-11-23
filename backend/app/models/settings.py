from sqlalchemy import Column, Integer, Float

from app.database import Base


class TestSettings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    test_duration_minutes = Column(Integer, default=15, nullable=False)
    pass_percentage = Column(Float, default=60.0, nullable=False)
