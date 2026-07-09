from fastapi import APIRouter
from .habits.router import router as habits_router
from .settings.router import router as settings_router

router = APIRouter(prefix="/api")
router.include_router(habits_router)
router.include_router(settings_router)

__all__ = ["router"]
