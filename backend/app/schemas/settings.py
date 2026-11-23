from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    test_duration_minutes: int
    pass_percentage: float


class SettingsOut(BaseModel):
    test_duration_minutes: int
    pass_percentage: float

    model_config = {"from_attributes": True}
