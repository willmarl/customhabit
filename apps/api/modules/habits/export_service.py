import json
from datetime import date

from fastapi import HTTPException
from sqlmodel import Session, select

from lib.dates import resolve_habit_date
from modules.settings.service import SettingsService
from .schemas import DayRun, DayRunStatus, Habit, HabitSession
from .stats_service import _get_stack_habit_ids


class ExportService:
    def __init__(self, session: Session):
        self.session = session

    def _stack_positions(self) -> dict[int, int]:
        stack_ids = _get_stack_habit_ids(self.session)
        return {habit_id: index + 1 for index, habit_id in enumerate(stack_ids)}

    def export_sessions_jsonl(
        self,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> str:
        settings = SettingsService(self.session).get()
        today = resolve_habit_date(day_start=settings.day_start_time)
        start = from_date or today.replace(year=today.year - 10)
        end = to_date or today

        if start > end:
            raise HTTPException(status_code=400, detail="'from' must be on or before 'to'")

        sessions = list(
            self.session.exec(
                select(HabitSession)
                .where(HabitSession.session_date >= start)
                .where(HabitSession.session_date <= end)
                .order_by(HabitSession.session_date, HabitSession.started_at)
            ).all()
        )

        habits = {h.id: h for h in self.session.exec(select(Habit)).all()}
        day_runs = {
            dr.run_date: dr
            for dr in self.session.exec(
                select(DayRun)
                .where(DayRun.run_date >= start)
                .where(DayRun.run_date <= end)
            ).all()
        }
        stack_pos = self._stack_positions()

        lines: list[str] = []
        for session_row in sessions:
            habit = habits.get(session_row.habit_id)
            if habit is None:
                continue

            day_run = day_runs.get(session_row.session_date)
            mode = day_run.mode if day_run else "normal"
            tap_out = (
                day_run is not None
                and day_run.status == DayRunStatus.tap_out.value
            )

            row = {
                "habit_name": habit.name,
                "duration": session_row.duration_seconds,
                "time_of_day": session_row.started_at.strftime("%H:%M"),
                "day_of_week": session_row.session_date.strftime("%A"),
                "stack_position": stack_pos.get(session_row.habit_id),
                "mode": mode,
                "tap_out": tap_out,
                "session_date": session_row.session_date.isoformat(),
                "started_at": session_row.started_at.isoformat(),
                "ended_at": (
                    session_row.ended_at.isoformat()
                    if session_row.ended_at is not None
                    else None
                ),
                "loop_index": session_row.loop_index,
                "source": session_row.source,
            }
            lines.append(json.dumps(row, ensure_ascii=False))

        if not lines:
            return ""
        return "\n".join(lines) + "\n"
