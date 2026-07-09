from fastapi import APIRouter, Depends
from sqlmodel import Session

from db import get_session
from .schemas import AppSettingsRead, AppSettingsUpdate
from .service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


def get_settings_service(session: Session = Depends(get_session)) -> SettingsService:
    return SettingsService(session)


@router.get("", response_model=AppSettingsRead)
async def get_settings(service: SettingsService = Depends(get_settings_service)):
    return service.get()


@router.patch("", response_model=AppSettingsRead)
async def update_settings(
    data: AppSettingsUpdate,
    service: SettingsService = Depends(get_settings_service),
):
    return service.update(data)
