from sqlmodel import SQLModel, Session, create_engine, select

from modules.settings.schemas import AppSettings
from modules.habits.schemas import HabitGroup, HabitGroupType, Habit, Completion

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


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
seed_defaults()


def get_session():
    with Session(engine) as session:
        yield session
