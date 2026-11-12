from fastapi import APIRouter, Depends
from sqlmodel import Session

from db import get_session

from .schemas import CashInRequest, CasinoState, CasinoSettingsUpdate, PlayAction
from .service import CasinoService

router = APIRouter(prefix="/casino", tags=["casino"])


def get_casino_service(session: Session = Depends(get_session)) -> CasinoService:
    return CasinoService(session)


@router.get("/state", response_model=CasinoState)
async def get_state(service: CasinoService = Depends(get_casino_service)):
    return service.get_state()


@router.post("/draw", response_model=CasinoState)
async def draw(
    data: PlayAction,
    service: CasinoService = Depends(get_casino_service),
):
    return service.draw(data.play_id)


@router.post("/cash-in", response_model=CasinoState)
async def cash_in(
    data: CashInRequest,
    service: CasinoService = Depends(get_casino_service),
):
    return service.cash_in(data.play_id, data.token_ids)


@router.post("/spin", response_model=CasinoState)
async def spin(
    data: PlayAction,
    service: CasinoService = Depends(get_casino_service),
):
    return service.spin(data.play_id)


@router.post("/bonus/spin", response_model=CasinoState)
async def bonus_spin(
    data: PlayAction,
    service: CasinoService = Depends(get_casino_service),
):
    return service.bonus_spin(data.play_id)


@router.post("/bonus/complete", response_model=CasinoState)
async def complete_bonus(
    data: PlayAction,
    service: CasinoService = Depends(get_casino_service),
):
    return service.complete_bonus(data.play_id)


@router.patch("/settings", response_model=CasinoState)
async def update_settings(
    data: CasinoSettingsUpdate,
    service: CasinoService = Depends(get_casino_service),
):
    return service.update_settings(data)
