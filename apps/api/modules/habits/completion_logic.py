from datetime import date

from sqlmodel import Session, select

from modules.settings.schemas import AppSettingsRead
from .schemas import (
    Completion,
    CompletionStatus,
    DayRun,
    DayRunMode,
    Habit,
    HabitSession,
)


def get_loops_target(
    habit: Habit,
    day_run: DayRun | None,
    settings: AppSettingsRead,
) -> int:
    if habit.once_per_day:
        return 1
    if day_run is None or day_run.mode == DayRunMode.normal.value:
        return 1
    if day_run.mode == DayRunMode.half.value:
        return 2
    if habit.duration_minutes < settings.loop_exempt_below_minutes:
        return 1
    return day_run.loop_count if day_run.loop_count > 0 else 2


def completion_status(loops_done: int, loops_target: int) -> str:
    if loops_done <= 0:
        return CompletionStatus.pending.value
    if loops_done >= loops_target:
        return CompletionStatus.done.value
    return CompletionStatus.partial.value


def in_zone_full_session(
    session: Session, habit_id: int, run_date: date, min_seconds: int = 3600
) -> bool:
    sessions = list(
        session.exec(
            select(HabitSession)
            .where(HabitSession.habit_id == habit_id)
            .where(HabitSession.session_date == run_date)
            .where(HabitSession.duration_seconds.isnot(None))
        ).all()
    )
    return any((s.duration_seconds or 0) >= min_seconds for s in sessions)


def loops_after_toggle(
    session: Session,
    habit: Habit,
    run_date: date,
    day_run: DayRun | None,
    settings: AppSettingsRead,
    existing: Completion | None,
) -> tuple[int, int, str] | None:
    """Returns (loops_done, loops_target, status) or None to delete completion."""
    target = get_loops_target(habit, day_run, settings)

    if existing is None:
        done = 1
        if (
            day_run
            and day_run.mode == DayRunMode.in_zone.value
            and in_zone_full_session(session, habit.id, run_date)
        ):
            done = target
        return done, target, completion_status(done, target)

    if existing.loops_done >= existing.loops_target:
        return None

    done = existing.loops_done + 1
    if (
        day_run
        and day_run.mode == DayRunMode.in_zone.value
        and done < target
        and in_zone_full_session(session, habit.id, run_date)
    ):
        done = target
    return done, target, completion_status(done, target)
