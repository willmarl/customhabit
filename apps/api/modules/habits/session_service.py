from datetime import date, datetime

from fastapi import HTTPException
from sqlmodel import Session, select

from .schemas import (
    Completion,
    DayActivityResponse,
    DayRun,
    DayRunRead,
    DayRunStatus,
    Habit,
    HabitSession,
    HabitSessionRead,
    SessionSource,
    StartSessionRequest,
    StopSessionRequest,
    UpdateDayRunRequest,
)


class SessionService:
    def __init__(self, session: Session):
        self.session = session

    def _resolve_date(self, d: date | None) -> date:
        return d or date.today()

    def _ensure_day_run(self, run_date: date, started_at: datetime) -> DayRun:
        day_run = self.session.get(DayRun, run_date)
        if not day_run:
            day_run = DayRun(run_date=run_date, started_at=started_at, status=DayRunStatus.active.value)
            self.session.add(day_run)
        elif day_run.started_at is None:
            day_run.started_at = started_at
            self.session.add(day_run)
        return day_run

    def _stop_active_sessions(self, run_date: date, ended_at: datetime) -> None:
        active = list(
            self.session.exec(
                select(HabitSession)
                .where(HabitSession.session_date == run_date)
                .where(HabitSession.ended_at.is_(None))
            ).all()
        )
        for s in active:
            s.ended_at = ended_at
            s.duration_seconds = max(0, int((ended_at - s.started_at).total_seconds()))
            self.session.add(s)

    def _compute_breaks(self, sessions: list[HabitSession]) -> list[int]:
        completed = [s for s in sessions if s.ended_at is not None]
        completed.sort(key=lambda s: s.started_at)
        breaks: list[int] = []
        for i in range(1, len(completed)):
            gap = int((completed[i].started_at - completed[i - 1].ended_at).total_seconds())
            if gap > 0:
                breaks.append(gap)
        return breaks

    def get_day_activity(self, run_date: date | None = None) -> DayActivityResponse:
        d = self._resolve_date(run_date)
        sessions = list(
            self.session.exec(
                select(HabitSession)
                .where(HabitSession.session_date == d)
                .order_by(HabitSession.started_at)
            ).all()
        )
        day_run = self.session.get(DayRun, d)
        active = next((s for s in sessions if s.ended_at is None), None)
        return DayActivityResponse(
            day_run=DayRunRead.from_row(day_run) if day_run else None,
            sessions=[HabitSessionRead.from_row(s) for s in sessions],
            active_session=HabitSessionRead.from_row(active) if active else None,
            break_seconds=self._compute_breaks(sessions),
        )

    def start_session(self, data: StartSessionRequest) -> HabitSessionRead:
        habit = self.session.get(Habit, data.habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        if habit.linked_sub_group_id is not None:
            raise HTTPException(status_code=400, detail="Cannot time linked core rows")

        run_date = self._resolve_date(data.date)
        now = datetime.now()
        self._stop_active_sessions(run_date, now)
        self._ensure_day_run(run_date, now)

        session_row = HabitSession(
            habit_id=data.habit_id,
            session_date=run_date,
            started_at=now,
            loop_index=data.loop_index,
            source=data.source.value,
        )
        self.session.add(session_row)
        self.session.commit()
        self.session.refresh(session_row)
        return HabitSessionRead.from_row(session_row)

    def stop_session(self, data: StopSessionRequest) -> HabitSessionRead:
        session_row = self.session.get(HabitSession, data.session_id)
        if not session_row:
            raise HTTPException(status_code=404, detail="Session not found")
        if session_row.ended_at is not None:
            raise HTTPException(status_code=400, detail="Session already stopped")

        now = datetime.now()
        session_row.ended_at = now
        session_row.duration_seconds = max(
            0, int((now - session_row.started_at).total_seconds())
        )
        self.session.add(session_row)
        self.session.commit()
        self.session.refresh(session_row)
        return HabitSessionRead.from_row(session_row)

    def get_sessions(self, run_date: date | None = None) -> list[HabitSessionRead]:
        d = self._resolve_date(run_date)
        sessions = list(
            self.session.exec(
                select(HabitSession)
                .where(HabitSession.session_date == d)
                .order_by(HabitSession.started_at)
            ).all()
        )
        return [HabitSessionRead.from_row(s) for s in sessions]

    def get_day_run(self, run_date: date | None = None) -> DayRunRead | None:
        d = self._resolve_date(run_date)
        day_run = self.session.get(DayRun, d)
        return DayRunRead.from_row(day_run) if day_run else None

    def update_day_run(self, data: UpdateDayRunRequest) -> DayRunRead:
        day_run = self.session.get(DayRun, data.date)
        if not day_run:
            day_run = DayRun(run_date=data.date)
        for key, value in data.model_dump(exclude_unset=True).items():
            if key == "date":
                continue
            if key in ("status", "mode") and value is not None:
                setattr(day_run, key, value.value)
            else:
                setattr(day_run, key, value)
        self.session.add(day_run)
        self.session.commit()
        self.session.refresh(day_run)
        return DayRunRead.from_row(day_run)

    def record_inferred_completion(
        self, habit_id: int, run_date: date, completion_id: int, completed_at: datetime
    ) -> None:
        """Guesstimate session from time since last completion (or day anchor)."""
        day_run = self.session.get(DayRun, run_date)
        if not day_run:
            day_run = DayRun(
                run_date=run_date,
                started_at=completed_at,
                status=DayRunStatus.active.value,
            )
            self.session.add(day_run)
            anchor = completed_at
        else:
            if day_run.started_at is None:
                day_run.started_at = completed_at
                self.session.add(day_run)
            last = self.session.exec(
                select(Completion)
                .where(Completion.date == run_date)
                .where(Completion.completed_at.isnot(None))
                .where(Completion.id != completion_id)
                .order_by(Completion.completed_at.desc())
            ).first()
            anchor = (
                last.completed_at
                if last and last.completed_at
                else day_run.started_at or completed_at
            )

        duration = max(0, int((completed_at - anchor).total_seconds()))
        self.session.add(
            HabitSession(
                habit_id=habit_id,
                session_date=run_date,
                started_at=anchor,
                ended_at=completed_at,
                duration_seconds=duration,
                source=SessionSource.toggle.value,
                completion_id=completion_id,
            )
        )

    def remove_inferred_completion(self, completion_id: int) -> None:
        session_row = self.session.exec(
            select(HabitSession).where(HabitSession.completion_id == completion_id)
        ).first()
        if session_row:
            self.session.delete(session_row)
