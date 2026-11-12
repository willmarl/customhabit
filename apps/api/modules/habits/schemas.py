from datetime import date, datetime
from enum import Enum
import re
from typing import Optional

from sqlalchemy import Column, JSON, Text
from sqlmodel import SQLModel, Field


class HabitGroupType(str, Enum):
    core = "core"
    sub = "sub"


class HabitType(str, Enum):
    normal = "normal"
    round_robin = "round_robin"


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
    buffer_minutes: int = Field(default=0)
    once_per_day: bool = Field(default=False)
    reward_enabled: bool = Field(default=False)
    retired_at: Optional[datetime] = None
    habit_type: str = Field(default=HabitType.normal.value)
    round_robin_items: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, server_default="[]"),
    )
    round_robin_started_on: Optional[date] = None


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


class CompletionStatus(str, Enum):
    pending = "pending"
    partial = "partial"
    done = "done"
    skipped_in_zone = "skipped_in_zone"


class Completion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    habit_id: int = Field(foreign_key="habit.id")
    date: date
    completed_at: Optional[datetime] = None
    loops_done: int = Field(default=0)
    loops_target: int = Field(default=1)
    status: str = Field(default=CompletionStatus.pending.value)


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
    buffer_minutes: int = 0
    once_per_day: bool
    reward_enabled: bool = False
    retired_at: Optional[datetime] = None
    habit_type: str = HabitType.normal.value
    round_robin_items: list[str] = Field(default_factory=list)
    round_robin_started_on: Optional[date] = None


class CompletionRead(SQLModel):
    habit_id: int
    date: date
    loops_done: int
    loops_target: int
    status: str

    @classmethod
    def from_row(cls, row: "Completion") -> "CompletionRead":
        return cls(
            habit_id=row.habit_id,
            date=row.date,
            loops_done=row.loops_done,
            loops_target=row.loops_target,
            status=row.status,
        )


class RetiredHabitRead(HabitRead):
    group_name: str


class RetiredHabitsResponse(SQLModel):
    habits: list[RetiredHabitRead]
    completions: list[CompletionRead]


class HabitBoardSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    payload: str = Field(sa_column=Column(Text, nullable=False))


class SnapshotPayload(SQLModel):
    core_group: HabitGroupRead
    sub_groups: list[HabitGroupRead]
    habits: list[HabitRead]


class SnapshotSummary(SQLModel):
    id: int
    name: str
    created_at: datetime


class SnapshotDetail(SnapshotSummary):
    payload: SnapshotPayload


class CreateSnapshotRequest(SQLModel):
    name: str


class DayStatRead(SQLModel):
    date: date
    habits_done: int
    stack_complete: bool


class StatsSummaryRead(SQLModel):
    from_date: date
    to_date: date
    days: list[DayStatRead]
    max_habits_in_day: int
    lifetime_habits_done: int
    current_streak: int
    longest_streak: int
    longest_true_streak: int


class BoardResponse(SQLModel):
    core_group: HabitGroupRead
    sub_groups: list[HabitGroupRead]
    habits: list[HabitRead]
    completions: list[CompletionRead]
    settings: "AppSettingsRead"
    day_run: Optional["DayRunRead"] = None


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
    buffer_minutes: Optional[int] = None
    once_per_day: Optional[bool] = None
    reward_enabled: Optional[bool] = None
    habit_type: Optional[HabitType] = None
    round_robin_items: Optional[list[str]] = None


class UpdateHabitRequest(SQLModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None
    once_per_day: Optional[bool] = None
    reward_enabled: Optional[bool] = None
    habit_type: Optional[HabitType] = None
    round_robin_items: Optional[list[str]] = None


class ReorderHabitItem(SQLModel):
    id: int
    sort_order: int


class ReorderHabitsRequest(SQLModel):
    items: list[ReorderHabitItem]


class ToggleCompletionRequest(SQLModel):
    habit_id: int
    date: date


class SessionSource(str, Enum):
    manual = "manual"
    timer = "timer"
    toggle = "toggle"


class DayRunStatus(str, Enum):
    active = "active"
    completed = "completed"
    tap_out = "tap_out"


class DayRunMode(str, Enum):
    normal = "normal"
    half = "half"
    loop_30 = "loop_30"  # vestigial
    in_zone = "in_zone"  # vestigial


class HabitSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    habit_id: int = Field(foreign_key="habit.id")
    session_date: date = Field(index=True)
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    loop_index: int = Field(default=0)
    source: str = Field(default=SessionSource.timer.value)
    completion_id: Optional[int] = Field(default=None, foreign_key="completion.id")


class DayRun(SQLModel, table=True):
    run_date: date = Field(primary_key=True)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    tap_out_at: Optional[datetime] = None
    status: str = Field(default=DayRunStatus.active.value)
    mode: str = Field(default=DayRunMode.normal.value)
    loop_count: int = Field(default=2)


class HabitSessionRead(SQLModel):
    id: int
    habit_id: int
    date: date
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    loop_index: int
    source: str

    @classmethod
    def from_row(cls, row: "HabitSession") -> "HabitSessionRead":
        return cls(
            id=row.id,
            habit_id=row.habit_id,
            date=row.session_date,
            started_at=row.started_at,
            ended_at=row.ended_at,
            duration_seconds=row.duration_seconds,
            loop_index=row.loop_index,
            source=row.source,
        )


class StartSessionRequest(SQLModel):
    habit_id: int
    session_date: Optional[date] = Field(default=None, alias="date")
    loop_index: int = 0
    source: SessionSource = SessionSource.timer


class StopSessionRequest(SQLModel):
    session_id: int


class DayRunRead(SQLModel):
    date: date
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    tap_out_at: Optional[datetime] = None
    status: str
    mode: str
    loop_count: int

    @classmethod
    def from_row(cls, row: "DayRun") -> "DayRunRead":
        return cls(
            date=row.run_date,
            started_at=row.started_at,
            ended_at=row.ended_at,
            tap_out_at=row.tap_out_at,
            status=row.status,
            mode=row.mode,
            loop_count=row.loop_count,
        )


class UpdateDayRunRequest(SQLModel):
    date: date
    status: Optional[DayRunStatus] = None
    mode: Optional[DayRunMode] = None
    loop_count: Optional[int] = None
    ended_at: Optional[datetime] = None


class TapOutRequest(SQLModel):
    tap_date: Optional[date] = Field(default=None, alias="date")


class DayActivityResponse(SQLModel):
    day_run: Optional[DayRunRead] = None
    sessions: list[HabitSessionRead]
    active_session: Optional[HabitSessionRead] = None
    break_seconds: list[int]
    # habit_id -> duration_seconds of latest ended timer session (excl. active)
    previous_durations: dict[int, int] = Field(default_factory=dict)


from modules.settings.schemas import AppSettingsRead  # noqa: E402

BoardResponse.model_rebuild()
