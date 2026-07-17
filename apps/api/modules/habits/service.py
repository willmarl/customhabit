from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select, delete

from lib.dates import resolve_habit_date
from modules.settings.service import SettingsService
from .completion_logic import loops_after_toggle
from .round_robin import normalize_round_robin_items
from .schemas import DayRun, DayRunRead
from .session_service import SessionService
from .schemas import (
    BoardResponse,
    is_valid_sub_color,
    MIN_HABIT_MINUTES,
    Completion,
    CompletionRead,
    CreateHabitRequest,
    CreateSubGroupRequest,
    Habit,
    HabitGroup,
    HabitGroupRead,
    HabitGroupType,
    HabitRead,
    HabitType,
    ReorderHabitsRequest,
    RetiredHabitRead,
    RetiredHabitsResponse,
    ToggleCompletionRequest,
    UpdateGroupRequest,
    UpdateHabitRequest,
)


class HabitService:
    def __init__(self, session: Session):
        self.session = session

    def _get_core_group(self) -> HabitGroup:
        core = self.session.exec(
            select(HabitGroup).where(HabitGroup.type == HabitGroupType.core)
        ).first()
        if not core:
            raise HTTPException(status_code=500, detail="Core group not initialized")
        return core

    def _next_sort_order(self, group_id: int) -> int:
        habits = self.session.exec(
            select(Habit).where(Habit.group_id == group_id).where(Habit.retired_at.is_(None))
        ).all()
        if not habits:
            return 0
        return max(h.sort_order for h in habits) + 1

    def _next_sub_sort_order(self) -> int:
        groups = self.session.exec(
            select(HabitGroup).where(HabitGroup.type == HabitGroupType.sub)
        ).all()
        if not groups:
            return 0
        return max(g.sort_order for g in groups) + 1

    def _delete_habit_completions(self, habit_ids: list[int]) -> None:
        if not habit_ids:
            return
        self.session.exec(delete(Completion).where(Completion.habit_id.in_(habit_ids)))

    def _get_habit_or_404(self, habit_id: int) -> Habit:
        habit = self.session.get(Habit, habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        return habit

    def _ensure_editable_habit(self, habit: Habit) -> None:
        if habit.linked_sub_group_id is not None:
            raise HTTPException(
                status_code=403,
                detail="Cannot modify linked core row; manage the sub-category instead",
            )
        if habit.retired_at is not None:
            raise HTTPException(status_code=403, detail="Habit is retired")

    def get_board(self) -> BoardResponse:
        settings = SettingsService(self.session).get()
        core = self._get_core_group()
        sub_groups = list(
            self.session.exec(
                select(HabitGroup)
                .where(HabitGroup.type == HabitGroupType.sub)
                .order_by(HabitGroup.sort_order)
            ).all()
        )
        group_ids = [core.id] + [g.id for g in sub_groups]
        habits = list(
            self.session.exec(
                select(Habit)
                .where(Habit.group_id.in_(group_ids))
                .where(Habit.retired_at.is_(None))
                .order_by(Habit.sort_order)
            ).all()
        )

        today = resolve_habit_date(day_start=settings.day_start_time)
        start = today - timedelta(days=settings.lookback_days - 1)
        habit_ids = [h.id for h in habits]
        completions: list[Completion] = []
        if habit_ids:
            completions = list(
                self.session.exec(
                    select(Completion)
                    .where(Completion.habit_id.in_(habit_ids))
                    .where(Completion.date >= start)
                    .where(Completion.date <= today)
                ).all()
            )

        return BoardResponse(
            core_group=HabitGroupRead.model_validate(core),
            sub_groups=[HabitGroupRead.model_validate(g) for g in sub_groups],
            habits=[HabitRead.model_validate(h) for h in habits],
            completions=[CompletionRead.from_row(c) for c in completions],
            settings=settings,
            day_run=(
                DayRunRead.from_row(dr)
                if (dr := self.session.get(DayRun, today))
                else None
            ),
        )

    def create_sub_group(self, data: CreateSubGroupRequest) -> BoardResponse:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")

        existing = self.session.exec(
            select(HabitGroup).where(
                HabitGroup.type == HabitGroupType.sub,
                HabitGroup.name == name,
            )
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Sub-category already exists")

        core = self._get_core_group()
        sub_group = HabitGroup(
            type=HabitGroupType.sub,
            name=name,
            sort_order=self._next_sub_sort_order(),
        )
        self.session.add(sub_group)
        self.session.flush()

        core_habit = Habit(
            group_id=core.id,
            name=name,
            sort_order=self._next_sort_order(core.id),
            linked_sub_group_id=sub_group.id,
        )
        self.session.add(core_habit)
        self.session.commit()
        return self.get_board()

    def update_group(self, group_id: int, data: UpdateGroupRequest) -> HabitGroupRead:
        group = self.session.get(HabitGroup, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        if data.name is not None and group.type == HabitGroupType.core:
            raise HTTPException(status_code=400, detail="Cannot rename core group")

        if data.color is not None:
            if group.type != HabitGroupType.sub:
                raise HTTPException(status_code=400, detail="Only sub-categories can have colors")
            if not is_valid_sub_color(data.color):
                raise HTTPException(status_code=400, detail="Invalid color")

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(group, key, value)
        self.session.add(group)

        if data.name is not None and group.type == HabitGroupType.sub:
            linked = self.session.exec(
                select(Habit).where(Habit.linked_sub_group_id == group.id)
            ).first()
            if linked:
                linked.name = data.name.strip()
                self.session.add(linked)

        self.session.commit()
        self.session.refresh(group)
        return HabitGroupRead.model_validate(group)

    def delete_sub_group(self, group_id: int) -> BoardResponse:
        group = self.session.get(HabitGroup, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.type == HabitGroupType.core:
            raise HTTPException(status_code=403, detail="Cannot delete core group")

        linked = self.session.exec(
            select(Habit).where(Habit.linked_sub_group_id == group.id)
        ).first()
        if linked:
            self._delete_habit_completions([linked.id])
            self.session.delete(linked)

        sub_habits = list(
            self.session.exec(select(Habit).where(Habit.group_id == group.id)).all()
        )
        sub_habit_ids = [h.id for h in sub_habits]
        self._delete_habit_completions(sub_habit_ids)
        for h in sub_habits:
            self.session.delete(h)

        self.session.delete(group)
        self.session.commit()
        return self.get_board()

    def _validate_duration(self, minutes: int) -> None:
        if minutes < MIN_HABIT_MINUTES:
            raise HTTPException(
                status_code=400,
                detail=f"duration_minutes must be at least {MIN_HABIT_MINUTES}",
            )

    def _validate_round_robin_items(
        self, items: list[str] | None, *, require_active: bool
    ) -> list[str]:
        raw = items or []
        if len(raw) != len([x for x in raw if x.strip()]):
            raise HTTPException(
                status_code=400, detail="Round-robin members cannot be blank"
            )
        normalized = normalize_round_robin_items(raw)
        if len(normalized) != len([x.strip() for x in raw if x.strip()]):
            raise HTTPException(
                status_code=400, detail="Round-robin members must be unique"
            )
        if require_active and len(normalized) < 2:
            raise HTTPException(
                status_code=400,
                detail="Round-robin habits need at least two members",
            )
        return normalized

    def _habit_day_today(self) -> date:
        settings = SettingsService(self.session).get()
        return resolve_habit_date(day_start=settings.day_start_time)

    def create_habit(self, data: CreateHabitRequest) -> HabitRead:
        group = self.session.get(HabitGroup, data.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")

        settings = SettingsService(self.session).get()
        duration = (
            data.duration_minutes
            if data.duration_minutes is not None
            else settings.default_habit_minutes
        )
        self._validate_duration(duration)

        habit_type = (
            data.habit_type.value
            if data.habit_type is not None
            else HabitType.normal.value
        )
        items = self._validate_round_robin_items(
            data.round_robin_items,
            require_active=habit_type == HabitType.round_robin.value,
        )
        started_on = (
            self._habit_day_today()
            if habit_type == HabitType.round_robin.value
            else None
        )

        habit = Habit(
            group_id=data.group_id,
            name=name,
            sort_order=self._next_sort_order(data.group_id),
            duration_minutes=duration,
            once_per_day=data.once_per_day or False,
            habit_type=habit_type,
            round_robin_items=items,
            round_robin_started_on=started_on,
        )
        self.session.add(habit)
        self.session.commit()
        self.session.refresh(habit)
        return HabitRead.model_validate(habit)

    def update_habit(self, habit_id: int, data: UpdateHabitRequest) -> HabitRead:
        habit = self._get_habit_or_404(habit_id)
        self._ensure_editable_habit(habit)

        if habit.linked_sub_group_id is not None and data.name is not None:
            sub_group = self.session.get(HabitGroup, habit.linked_sub_group_id)
            if sub_group:
                sub_group.name = data.name.strip()
                self.session.add(sub_group)

        payload = data.model_dump(exclude_unset=True)
        prev_type = habit.habit_type or HabitType.normal.value
        prev_items = list(habit.round_robin_items or [])

        if "name" in payload and payload["name"] is not None:
            habit.name = payload["name"].strip()
        if "duration_minutes" in payload and payload["duration_minutes"] is not None:
            self._validate_duration(payload["duration_minutes"])
            habit.duration_minutes = payload["duration_minutes"]
        if "once_per_day" in payload and payload["once_per_day"] is not None:
            habit.once_per_day = payload["once_per_day"]

        next_type = prev_type
        if "habit_type" in payload and payload["habit_type"] is not None:
            value = payload["habit_type"]
            next_type = value.value if isinstance(value, HabitType) else value
            habit.habit_type = next_type

        items_changed = False
        if "round_robin_items" in payload:
            items = self._validate_round_robin_items(
                payload["round_robin_items"],
                require_active=next_type == HabitType.round_robin.value,
            )
            items_changed = items != prev_items
            habit.round_robin_items = items
        elif next_type == HabitType.round_robin.value:
            # Ensure existing items still valid when enabling round-robin
            habit.round_robin_items = self._validate_round_robin_items(
                prev_items, require_active=True
            )

        converting_to_rr = (
            prev_type != HabitType.round_robin.value
            and next_type == HabitType.round_robin.value
        )
        converting_from_rr = (
            prev_type == HabitType.round_robin.value
            and next_type != HabitType.round_robin.value
        )

        if converting_from_rr:
            # Keep member list; stop rotation
            habit.round_robin_started_on = None
        elif next_type == HabitType.round_robin.value and (
            converting_to_rr or items_changed
        ):
            habit.round_robin_started_on = self._habit_day_today()

        self.session.add(habit)
        self.session.commit()
        self.session.refresh(habit)
        return HabitRead.model_validate(habit)

    def delete_habit(self, habit_id: int) -> None:
        habit = self._get_habit_or_404(habit_id)
        self._ensure_editable_habit(habit)

        self._delete_habit_completions([habit_id])
        self.session.delete(habit)
        self.session.commit()

    def retire_habit(self, habit_id: int) -> BoardResponse:
        habit = self._get_habit_or_404(habit_id)
        self._ensure_editable_habit(habit)
        if habit.retired_at is not None:
            raise HTTPException(status_code=400, detail="Habit is already retired")

        habit.retired_at = datetime.now()
        self.session.add(habit)
        self.session.commit()
        return self.get_board()

    def restore_habit(self, habit_id: int) -> BoardResponse:
        habit = self._get_habit_or_404(habit_id)
        if habit.retired_at is None:
            raise HTTPException(status_code=400, detail="Habit is not retired")

        habit.retired_at = None
        habit.sort_order = self._next_sort_order(habit.group_id)
        self.session.add(habit)
        self.session.commit()
        return self.get_board()

    def get_retired_habits(self) -> RetiredHabitsResponse:
        settings = SettingsService(self.session).get()
        groups = list(self.session.exec(select(HabitGroup)).all())
        group_names = {g.id: g.name for g in groups}

        retired = list(
            self.session.exec(
                select(Habit)
                .where(Habit.retired_at.isnot(None))
                .order_by(Habit.retired_at.desc())
            ).all()
        )

        today = resolve_habit_date(day_start=settings.day_start_time)
        start = today - timedelta(days=settings.lookback_days - 1)
        habit_ids = [h.id for h in retired if h.id is not None]
        completions: list[Completion] = []
        if habit_ids:
            completions = list(
                self.session.exec(
                    select(Completion)
                    .where(Completion.habit_id.in_(habit_ids))
                    .where(Completion.date >= start)
                    .where(Completion.date <= today)
                ).all()
            )

        return RetiredHabitsResponse(
            habits=[
                RetiredHabitRead(
                    id=h.id,
                    group_id=h.group_id,
                    name=h.name,
                    sort_order=h.sort_order,
                    linked_sub_group_id=h.linked_sub_group_id,
                    duration_minutes=h.duration_minutes,
                    once_per_day=h.once_per_day,
                    retired_at=h.retired_at,
                    group_name=group_names.get(h.group_id, "Unknown"),
                )
                for h in retired
                if h.id is not None
            ],
            completions=[CompletionRead.from_row(c) for c in completions],
        )

    def reorder_habits(self, data: ReorderHabitsRequest) -> None:
        for item in data.items:
            habit = self.session.get(Habit, item.id)
            if habit and habit.retired_at is None:
                habit.sort_order = item.sort_order
                self.session.add(habit)
        self.session.commit()

    def toggle_completion(self, data: ToggleCompletionRequest) -> CompletionRead | None:
        habit = self._get_habit_or_404(data.habit_id)
        if habit.retired_at is not None:
            raise HTTPException(status_code=403, detail="Habit is retired")

        if habit.linked_sub_group_id is not None:
            raise HTTPException(
                status_code=403,
                detail="Linked core habits are completed automatically from their sub-category",
            )

        settings = SettingsService(self.session).get()
        day_run = self.session.get(DayRun, data.date)
        session_svc = SessionService(self.session)

        existing = self.session.exec(
            select(Completion).where(
                Completion.habit_id == data.habit_id,
                Completion.date == data.date,
            )
        ).first()

        result = loops_after_toggle(
            self.session, habit, data.date, day_run, settings, existing
        )

        if result is None:
            if existing:
                if existing.id is not None:
                    session_svc.remove_inferred_completion(existing.id)
                self.session.delete(existing)
                self.session.commit()
            return None

        loops_done, loops_target, status = result
        now = datetime.now()

        if existing is None:
            completion = Completion(
                habit_id=data.habit_id,
                date=data.date,
                completed_at=now,
                loops_done=loops_done,
                loops_target=loops_target,
                status=status,
            )
            self.session.add(completion)
            self.session.flush()
            session_svc.record_inferred_completion(
                data.habit_id, data.date, completion.id, now
            )
        else:
            existing.loops_done = loops_done
            existing.loops_target = loops_target
            existing.status = status
            existing.completed_at = now
            self.session.add(existing)
            if existing.id is not None:
                session_svc.update_inferred_completion(existing.id, data.date, now)
            completion = existing

        if day_run is None and data.date == resolve_habit_date(day_start=settings.day_start_time):
            session_svc.ensure_day_run(data.date, now)

        self.session.commit()
        self.session.refresh(completion)
        return CompletionRead.from_row(completion)
