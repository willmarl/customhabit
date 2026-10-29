import json
from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session, select

from .schemas import (
    BoardResponse,
    CreateSnapshotRequest,
    Habit,
    HabitGroup,
    HabitGroupRead,
    HabitGroupType,
    HabitRead,
    HabitBoardSnapshot,
    SnapshotDetail,
    SnapshotPayload,
    SnapshotSummary,
)


class SnapshotService:
    def __init__(self, session: Session):
        self.session = session

    def _get_core_group(self) -> HabitGroup:
        core = self.session.exec(
            select(HabitGroup).where(HabitGroup.type == HabitGroupType.core)
        ).first()
        if not core:
            raise HTTPException(status_code=500, detail="Core group not initialized")
        return core

    def _capture_payload(self) -> SnapshotPayload:
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
                .order_by(Habit.sort_order)
            ).all()
        )
        return SnapshotPayload(
            core_group=HabitGroupRead.model_validate(core),
            sub_groups=[HabitGroupRead.model_validate(g) for g in sub_groups],
            habits=[HabitRead.model_validate(h) for h in habits],
        )

    def _to_detail(self, row: HabitBoardSnapshot) -> SnapshotDetail:
        payload = SnapshotPayload.model_validate(json.loads(row.payload))
        return SnapshotDetail(
            id=row.id,
            name=row.name,
            created_at=row.created_at,
            payload=payload,
        )

    def list_snapshots(self) -> list[SnapshotSummary]:
        rows = list(
            self.session.exec(
                select(HabitBoardSnapshot).order_by(HabitBoardSnapshot.created_at.desc())
            ).all()
        )
        return [
            SnapshotSummary(id=r.id, name=r.name, created_at=r.created_at)
            for r in rows
            if r.id is not None
        ]

    def create_snapshot(self, data: CreateSnapshotRequest) -> SnapshotDetail:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")

        payload = self._capture_payload()
        row = HabitBoardSnapshot(
            name=name,
            created_at=datetime.now(),
            payload=json.dumps(payload.model_dump(mode="json")),
        )
        self.session.add(row)
        self.session.commit()
        self.session.refresh(row)
        return self._to_detail(row)

    def get_snapshot(self, snapshot_id: int) -> SnapshotDetail:
        row = self.session.get(HabitBoardSnapshot, snapshot_id)
        if not row:
            raise HTTPException(status_code=404, detail="Snapshot not found")
        return self._to_detail(row)

    def restore_snapshot(self, snapshot_id: int, habit_service) -> BoardResponse:
        detail = self.get_snapshot(snapshot_id)
        payload = detail.payload
        core = self._get_core_group()
        old_core_id = payload.core_group.id

        sub_groups = list(
            self.session.exec(
                select(HabitGroup).where(HabitGroup.type == HabitGroupType.sub)
            ).all()
        )
        for group in sub_groups:
            linked = self.session.exec(
                select(Habit).where(Habit.linked_sub_group_id == group.id)
            ).first()
            if linked:
                self.session.delete(linked)
            sub_habits = list(
                self.session.exec(select(Habit).where(Habit.group_id == group.id)).all()
            )
            for h in sub_habits:
                self.session.delete(h)
            self.session.delete(group)

        core_habits = list(
            self.session.exec(select(Habit).where(Habit.group_id == core.id)).all()
        )
        for h in core_habits:
            self.session.delete(h)

        self.session.flush()

        core.notes = payload.core_group.notes
        self.session.add(core)

        group_id_map: dict[int, int] = {}

        for sg in sorted(payload.sub_groups, key=lambda g: g.sort_order):
            new_group = HabitGroup(
                type=HabitGroupType.sub,
                name=sg.name,
                notes=sg.notes,
                sort_order=sg.sort_order,
                color=sg.color,
            )
            self.session.add(new_group)
            self.session.flush()
            group_id_map[sg.id] = new_group.id

            linked_src = next(
                (h for h in payload.habits if h.linked_sub_group_id == sg.id),
                None,
            )
            linked = Habit(
                group_id=core.id,
                name=sg.name,
                sort_order=linked_src.sort_order if linked_src else sg.sort_order,
                linked_sub_group_id=new_group.id,
                duration_minutes=linked_src.duration_minutes if linked_src else 60,
                buffer_minutes=(
                    linked_src.buffer_minutes if linked_src else 0
                ),
                once_per_day=linked_src.once_per_day if linked_src else False,
                retired_at=linked_src.retired_at if linked_src else None,
            )
            self.session.add(linked)

            for h in sorted(
                [x for x in payload.habits if x.group_id == sg.id and x.linked_sub_group_id is None],
                key=lambda x: x.sort_order,
            ):
                self.session.add(
                    Habit(
                        group_id=new_group.id,
                        name=h.name,
                        sort_order=h.sort_order,
                        duration_minutes=h.duration_minutes,
                        buffer_minutes=h.buffer_minutes or 0,
                        once_per_day=h.once_per_day,
                        retired_at=h.retired_at,
                        habit_type=h.habit_type,
                        round_robin_items=list(h.round_robin_items or []),
                        round_robin_started_on=h.round_robin_started_on,
                    )
                )

        for h in sorted(
            [
                x
                for x in payload.habits
                if x.group_id == old_core_id and x.linked_sub_group_id is None
            ],
            key=lambda x: x.sort_order,
        ):
            self.session.add(
                Habit(
                    group_id=core.id,
                    name=h.name,
                    sort_order=h.sort_order,
                    duration_minutes=h.duration_minutes,
                    buffer_minutes=h.buffer_minutes or 0,
                    once_per_day=h.once_per_day,
                    retired_at=h.retired_at,
                    habit_type=h.habit_type,
                    round_robin_items=list(h.round_robin_items or []),
                    round_robin_started_on=h.round_robin_started_on,
                )
            )

        self.session.commit()
        return habit_service.get_board()
