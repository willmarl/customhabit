from sqlmodel import SQLModel, Field
from typing import Optional


class AppSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    lookback_days: int = Field(default=7)


class AppSettingsRead(SQLModel):
    lookback_days: int


class AppSettingsUpdate(SQLModel):
    lookback_days: Optional[int] = None
