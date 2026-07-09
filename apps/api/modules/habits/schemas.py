from datetime import date
from enum import Enum
import re
from typing import Optional

from sqlmodel import SQLModel, Field


class HabitGroupType(str, Enum):
    core = "core"
    sub = "sub"


class HabitGroup(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: HabitGroupType
    name: str = "Core"
    notes: str = ""
    sort_order: int = 0
    color: str = Field(default="orange")


ALLOWED_SUB_COLORS = frozenset(
    {"orange", "green", "blue", "violet", "rose", "teal", "slate"}
)

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def is_valid_sub_color(color: str) -> bool:
    return color in ALLOWED_SUB_COLORS or bool(HEX_COLOR_RE.match(color))


# Floor for habit duration. Kept at 1 so any positive length is allowed;
# the "meaningful work" threshold is now the configurable loop_exempt_below_minutes setting.
MIN_HABIT_MINUTES = 1
# Only strip a trailing "Nm" from a habit name when it looks like an intentional
# duration tag (e.g. "leetcode 30m"), not an arbitrary tiny number.
DURATION_SUFFIX_MIN = 5


class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="habitgroup.id")
    name: str
    sort_order: int = 0
    linked_sub_group_id: Optional[int] = Field(default=None, foreign_key="habitgroup.id")
    duration_minutes: int = Field(default=60)
    once_per_day: bool = Field(default=False)


DURATION_SUFFIX_RE = re.compile(r"\s+(\d+)m\s*$", re.IGNORECASE)


def parse_duration_suffix(name: str) -> tuple[str, Optional[int]]:
    match = DURATION_SUFFIX_RE.search(name)
    if not match:
        return name, None
    minutes = int(match.group(1))
    if minutes < DURATION_SUFFIX_MIN:
        return name, None
    stripped = name[: match.start()].rstrip()
    return stripped, minutes


class Completion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    habit_id: int = Field(foreign_key="habit.id")
    date: date


class HabitGroupRead(SQLModel):
    id: int
    type: HabitGroupType
    name: str
    notes: str
    sort_order: int
    color: str


class HabitRead(SQLModel):
    id: int
    group_id: int
    name: str
    sort_order: int
    linked_sub_group_id: Optional[int] = None
    duration_minutes: int
    once_per_day: bool


class CompletionRead(SQLModel):
    habit_id: int
    date: date


class BoardResponse(SQLModel):
    core_group: HabitGroupRead
    sub_groups: list[HabitGroupRead]
    habits: list[HabitRead]
    completions: list[CompletionRead]
    settings: "AppSettingsRead"


class CreateSubGroupRequest(SQLModel):
    name: str


class UpdateGroupRequest(SQLModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None
    color: Optional[str] = None


class CreateHabitRequest(SQLModel):
    group_id: int
    name: str
    duration_minutes: Optional[int] = None
    once_per_day: Optional[bool] = None


class UpdateHabitRequest(SQLModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    once_per_day: Optional[bool] = None


class ReorderHabitItem(SQLModel):
    id: int
    sort_order: int


class ReorderHabitsRequest(SQLModel):
    items: list[ReorderHabitItem]


class ToggleCompletionRequest(SQLModel):
    habit_id: int
    date: date


from modules.settings.schemas import AppSettingsRead  # noqa: E402

BoardResponse.model_rebuild()
