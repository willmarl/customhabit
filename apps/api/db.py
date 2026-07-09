from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine, select

from modules.settings.schemas import AppSettings
from modules.habits.schemas import HabitGroup, HabitGroupType, Habit, Completion

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def migrate_schema() -> None:
    with engine.connect() as conn:
        cols = conn.execute(text("PRAGMA table_info(habitgroup)")).fetchall()
        col_names = {row[1] for row in cols}
        if "color" not in col_names:
            conn.execute(
                text(
                    "ALTER TABLE habitgroup ADD COLUMN color TEXT NOT NULL DEFAULT 'orange'"
                )
            )
            conn.commit()


def seed_defaults() -> None:
    with Session(engine) as session:
        core = session.exec(
            select(HabitGroup).where(HabitGroup.type == HabitGroupType.core)
        ).first()
        if not core:
            session.add(HabitGroup(type=HabitGroupType.core, name="Core", sort_order=0))

        settings = session.get(AppSettings, 1)
        if not settings:
            session.add(AppSettings(id=1, lookback_days=7))

        session.commit()


SQLModel.metadata.create_all(engine)
migrate_schema()
seed_defaults()


def get_session():
    with Session(engine) as session:
        yield session
