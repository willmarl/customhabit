from datetime import date, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select

from lib.dates import resolve_habit_date
from modules.settings.service import SettingsService
from .schemas import (
    Completion,
    DayStatRead,
    Habit,
    HabitGroup,
    HabitGroupType,
    StatsSummaryRead,
)


def _is_completion_done(c: Completion) -> bool:
    return c.loops_done >= c.loops_target


def _get_stack_habit_ids(session: Session) -> list[int]:
    core = session.exec(
        select(HabitGroup).where(HabitGroup.type == HabitGroupType.core)
    ).first()
    if not core:
        return []

    core_habits = list(
        session.exec(
            select(Habit)
            .where(Habit.group_id == core.id)
            .where(Habit.retired_at.is_(None))
            .order_by(Habit.sort_order)
        ).all()
    )

    ids: list[int] = []
    for h in core_habits:
        if h.linked_sub_group_id is not None:
            subs = list(
                session.exec(
                    select(Habit)
                    .where(Habit.group_id == h.linked_sub_group_id)
                    .where(Habit.retired_at.is_(None))
                    .order_by(Habit.sort_order)
                ).all()
            )
            ids.extend(s.id for s in subs)
        else:
            ids.append(h.id)

    return ids


def _done_by_date(completions: list[Completion]) -> dict[date, set[int]]:
    done: dict[date, set[int]] = {}
    for c in completions:
        if not _is_completion_done(c):
            continue
        done.setdefault(c.date, set()).add(c.habit_id)
    return done


def _day_stats(
    start: date,
    end: date,
    done_by_date: dict[date, set[int]],
    stack_ids: set[int],
) -> list[DayStatRead]:
    days: list[DayStatRead] = []
    d = start
    while d <= end:
        done_ids = done_by_date.get(d, set())
        days.append(
            DayStatRead(
                date=d,
                habits_done=len(done_ids),
                stack_complete=bool(stack_ids) and stack_ids.issubset(done_ids),
            )
        )
        d += timedelta(days=1)
    return days


def _streak_any(days: list[DayStatRead]) -> tuple[int, int]:
    longest = 0
    run = 0
    for day in days:
        if day.habits_done > 0:
            run += 1
            longest = max(longest, run)
        else:
            run = 0

    current = 0
    for day in reversed(days):
        if day.habits_done > 0:
            current += 1
        else:
            break

    return current, longest


def _longest_true_streak(days: list[DayStatRead]) -> int:
    longest = 0
    run = 0
    for day in days:
        if day.stack_complete:
            run += 1
            longest = max(longest, run)
        else:
            run = 0
    return longest


class StatsService:
    def __init__(self, session: Session):
        self.session = session

    def get_summary(
        self,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> StatsSummaryRead:
        settings = SettingsService(self.session).get()
        today = resolve_habit_date(day_start=settings.day_start_time)
        end = to_date or today
        start = from_date or (end - timedelta(days=364))

        if start > end:
            raise HTTPException(status_code=400, detail="from must be on or before to")

        span = (end - start).days + 1
        if span > 366:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 366 days")

        all_completions = list(self.session.exec(select(Completion)).all())
        done_completions = [c for c in all_completions if _is_completion_done(c)]
        lifetime_habits_done = len(done_completions)

        stack_ids = set(_get_stack_habit_ids(self.session))
        done_by_date = _done_by_date(all_completions)

        window_completions = [c for c in all_completions if start <= c.date <= end]
        window_done = _done_by_date(window_completions)
        heatmap_days = _day_stats(start, end, window_done, stack_ids)
        max_habits_in_day = max((day.habits_done for day in heatmap_days), default=0)

        if done_completions:
            streak_start = min(c.date for c in done_completions)
            streak_days = _day_stats(streak_start, today, done_by_date, stack_ids)
        else:
            streak_days = []

        current_streak, longest_streak = _streak_any(streak_days)
        longest_true_streak = _longest_true_streak(streak_days)

        return StatsSummaryRead(
            from_date=start,
            to_date=end,
            days=heatmap_days,
            max_habits_in_day=max_habits_in_day,
            lifetime_habits_done=lifetime_habits_done,
            current_streak=current_streak,
            longest_streak=longest_streak,
            longest_true_streak=longest_true_streak,
        )
