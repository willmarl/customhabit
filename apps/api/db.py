from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine, select

from modules.settings.schemas import AppSettings
from modules.habits.schemas import (
    DayRun,
    HabitBoardSnapshot,
    HabitGroup,
    HabitGroupType,
    Habit,
    HabitSession,
    parse_duration_suffix,
)

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def _add_column_if_missing(conn, table: str, column: str, ddl: str) -> None:
    cols = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    col_names = {row[1] for row in cols}
    if column not in col_names:
        conn.execute(text(ddl))
        conn.commit()


def migrate_schema() -> None:
    with engine.connect() as conn:
        _add_column_if_missing(
            conn,
            "habitgroup",
            "color",
            "ALTER TABLE habitgroup ADD COLUMN color TEXT NOT NULL DEFAULT 'orange'",
        )
        _add_column_if_missing(
            conn,
            "habit",
            "duration_minutes",
            "ALTER TABLE habit ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60",
        )
        _add_column_if_missing(
            conn,
            "habit",
            "once_per_day",
            "ALTER TABLE habit ADD COLUMN once_per_day INTEGER NOT NULL DEFAULT 0",
        )
        _add_column_if_missing(
            conn,
            "appsettings",
            "break_minutes",
            "ALTER TABLE appsettings ADD COLUMN break_minutes INTEGER NOT NULL DEFAULT 5",
        )
        _add_column_if_missing(
            conn,
            "appsettings",
            "wake_time",
            "ALTER TABLE appsettings ADD COLUMN wake_time TEXT NOT NULL DEFAULT '07:00'",
        )
        _add_column_if_missing(
            conn,
            "appsettings",
            "bed_time",
            "ALTER TABLE appsettings ADD COLUMN bed_time TEXT NOT NULL DEFAULT '23:00'",
        )
        _add_column_if_missing(
            conn,
            "appsettings",
            "default_habit_minutes",
            "ALTER TABLE appsettings ADD COLUMN default_habit_minutes INTEGER NOT NULL DEFAULT 60",
        )
        _add_column_if_missing(
            conn,
            "appsettings",
            "playlist_minutes",
            "ALTER TABLE appsettings ADD COLUMN playlist_minutes INTEGER NOT NULL DEFAULT 53",
        )
        _add_column_if_missing(
            conn,
            "appsettings",
            "day_start_time",
            "ALTER TABLE appsettings ADD COLUMN day_start_time TEXT NOT NULL DEFAULT '04:00'",
        )
        _add_column_if_missing(
            conn,
            "completion",
            "completed_at",
            "ALTER TABLE completion ADD COLUMN completed_at TEXT",
        )
        _add_column_if_missing(
            conn,
            "habitsession",
            "completion_id",
            "ALTER TABLE habitsession ADD COLUMN completion_id INTEGER REFERENCES completion(id)",
        )
        _add_column_if_missing(
            conn,
            "completion",
            "loops_done",
            "ALTER TABLE completion ADD COLUMN loops_done INTEGER NOT NULL DEFAULT 1",
        )
        _add_column_if_missing(
            conn,
            "completion",
            "loops_target",
            "ALTER TABLE completion ADD COLUMN loops_target INTEGER NOT NULL DEFAULT 1",
        )
        _add_column_if_missing(
            conn,
            "completion",
            "status",
            "ALTER TABLE completion ADD COLUMN status TEXT NOT NULL DEFAULT 'done'",
        )
        _add_column_if_missing(
            conn,
            "habit",
            "retired_at",
            "ALTER TABLE habit ADD COLUMN retired_at TEXT",
        )
        _add_column_if_missing(
            conn,
            "habit",
            "habit_type",
            "ALTER TABLE habit ADD COLUMN habit_type TEXT NOT NULL DEFAULT 'normal'",
        )
        _add_column_if_missing(
            conn,
            "habit",
            "round_robin_items",
            "ALTER TABLE habit ADD COLUMN round_robin_items TEXT NOT NULL DEFAULT '[]'",
        )
        _add_column_if_missing(
            conn,
            "habit",
            "round_robin_started_on",
            "ALTER TABLE habit ADD COLUMN round_robin_started_on TEXT",
        )


def migrate_habit_duration_suffixes() -> None:
    with Session(engine) as session:
        habits = list(session.exec(select(Habit)).all())
        changed = False
        for habit in habits:
            stripped, minutes = parse_duration_suffix(habit.name)
            if minutes is None:
                continue
            habit.name = stripped
            habit.duration_minutes = minutes
            session.add(habit)
            changed = True
        if changed:
            session.commit()


def seed_defaults() -> None:
    with Session(engine) as session:
        core = session.exec(
            select(HabitGroup).where(HabitGroup.type == HabitGroupType.core)
        ).first()
        if not core:
            session.add(HabitGroup(type=HabitGroupType.core, name="Core", sort_order=0))

        settings = session.get(AppSettings, 1)
        if not settings:
            session.add(AppSettings(id=1))

        session.commit()


SQLModel.metadata.create_all(engine)
migrate_schema()
seed_defaults()
migrate_habit_duration_suffixes()


def get_session():
    with Session(engine) as session:
        yield session
