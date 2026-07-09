import re
from typing import Optional

from sqlmodel import SQLModel, Field

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def is_valid_time_hhmm(value: str) -> bool:
    return bool(TIME_RE.match(value))


class AppSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    lookback_days: int = Field(default=7)
    break_minutes: int = Field(default=5)
    wake_time: str = Field(default="07:00")
    bed_time: str = Field(default="23:00")
    default_habit_minutes: int = Field(default=60)
    playlist_minutes: int = Field(default=53)
    # Habits shorter than this are exempt from double-loop in loop mode (Phase 3).
    loop_exempt_below_minutes: int = Field(default=60)


class AppSettingsRead(SQLModel):
    lookback_days: int
    break_minutes: int
    wake_time: str
    bed_time: str
    default_habit_minutes: int
    playlist_minutes: int
    loop_exempt_below_minutes: int


class AppSettingsUpdate(SQLModel):
    lookback_days: Optional[int] = None
    break_minutes: Optional[int] = None
    wake_time: Optional[str] = None
    bed_time: Optional[str] = None
    default_habit_minutes: Optional[int] = None
    playlist_minutes: Optional[int] = None
    loop_exempt_below_minutes: Optional[int] = None
