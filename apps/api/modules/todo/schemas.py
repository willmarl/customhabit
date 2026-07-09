from sqlmodel import SQLModel, Field
from typing import Optional


class TodoBase(SQLModel):
    title: str
    done: bool = False


class Todo(TodoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class TodoCreate(TodoBase):
    pass


class TodoUpdate(SQLModel):
    title: Optional[str] = None
    done: Optional[bool] = None
