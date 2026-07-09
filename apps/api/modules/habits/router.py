from fastapi import APIRouter, Depends, Response
from sqlmodel import Session

from db import get_session
from .schemas import (
    BoardResponse,
    CompletionRead,
    CreateHabitRequest,
    CreateSubGroupRequest,
    HabitGroupRead,
    HabitRead,
    ReorderHabitsRequest,
    ToggleCompletionRequest,
    UpdateGroupRequest,
    UpdateHabitRequest,
)
from .service import HabitService

router = APIRouter(prefix="/habits", tags=["habits"])


def get_habit_service(session: Session = Depends(get_session)) -> HabitService:
    return HabitService(session)


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
