from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlmodel import Session

from db import get_session
from .schemas import (
    BoardResponse,
    CompletionRead,
    CreateHabitRequest,
    CreateSubGroupRequest,
    DayActivityResponse,
    DayRunRead,
    HabitGroupRead,
    HabitRead,
    HabitSessionRead,
    ReorderHabitsRequest,
    RetiredHabitsResponse,
    StartSessionRequest,
    StopSessionRequest,
    TapOutRequest,
    ToggleCompletionRequest,
    UpdateDayRunRequest,
    UpdateGroupRequest,
    UpdateHabitRequest,
)
from .service import HabitService
from .session_service import SessionService

router = APIRouter(prefix="/habits", tags=["habits"])


def get_habit_service(session: Session = Depends(get_session)) -> HabitService:
    return HabitService(session)


def get_session_service(session: Session = Depends(get_session)) -> SessionService:
    return SessionService(session)


@router.get("/board", response_model=BoardResponse)
async def get_board(service: HabitService = Depends(get_habit_service)):
    return service.get_board()


@router.post("/groups/sub", response_model=BoardResponse)
async def create_sub_group(
    data: CreateSubGroupRequest,
    service: HabitService = Depends(get_habit_service),
):
    return service.create_sub_group(data)


@router.patch("/groups/{group_id}", response_model=HabitGroupRead)
async def update_group(
    group_id: int,
    data: UpdateGroupRequest,
    service: HabitService = Depends(get_habit_service),
):
    return service.update_group(group_id, data)


@router.delete("/groups/{group_id}", response_model=BoardResponse)
async def delete_sub_group(
    group_id: int,
    service: HabitService = Depends(get_habit_service),
):
    return service.delete_sub_group(group_id)


@router.post("", response_model=HabitRead)
async def create_habit(
    data: CreateHabitRequest,
    service: HabitService = Depends(get_habit_service),
):
    return service.create_habit(data)


@router.put("/reorder", status_code=204)
async def reorder_habits(
    data: ReorderHabitsRequest,
    service: HabitService = Depends(get_habit_service),
):
    service.reorder_habits(data)
    return Response(status_code=204)


@router.post("/completions/toggle", response_model=CompletionRead | None)
async def toggle_completion(
    data: ToggleCompletionRequest,
    service: HabitService = Depends(get_habit_service),
):
    return service.toggle_completion(data)


@router.get("/sessions/activity", response_model=DayActivityResponse)
async def get_day_activity(
    run_date: date | None = Query(default=None, alias="date"),
    service: SessionService = Depends(get_session_service),
):
    return service.get_day_activity(run_date)


@router.get("/sessions", response_model=list[HabitSessionRead])
async def get_sessions(
    run_date: date | None = Query(default=None, alias="date"),
    service: SessionService = Depends(get_session_service),
):
    return service.get_sessions(run_date)


@router.post("/sessions/start", response_model=HabitSessionRead)
async def start_session(
    data: StartSessionRequest,
    service: SessionService = Depends(get_session_service),
):
    return service.start_session(data)


@router.post("/sessions/stop", response_model=HabitSessionRead)
async def stop_session(
    data: StopSessionRequest,
    service: SessionService = Depends(get_session_service),
):
    return service.stop_session(data)


@router.get("/day-run", response_model=DayRunRead | None)
async def get_day_run(
    run_date: date | None = Query(default=None, alias="date"),
    service: SessionService = Depends(get_session_service),
):
    return service.get_day_run(run_date)


@router.patch("/day-run", response_model=DayRunRead)
async def update_day_run(
    data: UpdateDayRunRequest,
    service: SessionService = Depends(get_session_service),
):
    return service.update_day_run(data)


@router.post("/day-run/tap-out", response_model=DayRunRead)
async def tap_out_day(
    data: TapOutRequest,
    service: SessionService = Depends(get_session_service),
):
    return service.tap_out(data.tap_date)


@router.get("/retired", response_model=RetiredHabitsResponse)
async def get_retired_habits(service: HabitService = Depends(get_habit_service)):
    return service.get_retired_habits()


# Parameterized habit routes last — otherwise "/day-run" matches habit_id
@router.post("/{habit_id}/retire", response_model=BoardResponse)
async def retire_habit(
    habit_id: int,
    service: HabitService = Depends(get_habit_service),
):
    return service.retire_habit(habit_id)


@router.post("/{habit_id}/restore", response_model=BoardResponse)
async def restore_habit(
    habit_id: int,
    service: HabitService = Depends(get_habit_service),
):
    return service.restore_habit(habit_id)


@router.patch("/{habit_id}", response_model=HabitRead)
async def update_habit(
    habit_id: int,
    data: UpdateHabitRequest,
    service: HabitService = Depends(get_habit_service),
):
    return service.update_habit(habit_id, data)


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(
    habit_id: int,
    service: HabitService = Depends(get_habit_service),
):
    service.delete_habit(habit_id)
    return Response(status_code=204)
