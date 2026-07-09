from datetime import date
from enum import Enum
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


class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="habitgroup.id")
    name: str
    sort_order: int = 0
    linked_sub_group_id: Optional[int] = Field(default=None, foreign_key="habitgroup.id")


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


class HabitRead(SQLModel):
    id: int
    group_id: int
    name: str
    sort_order: int
    linked_sub_group_id: Optional[int] = None


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


class CreateHabitRequest(SQLModel):
    group_id: int
    name: str


class UpdateHabitRequest(SQLModel):
    name: Optional[str] = None


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
