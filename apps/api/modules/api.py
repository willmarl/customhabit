from fastapi import APIRouter
from .todo.router import router as todo_router

router = APIRouter(prefix="/api")
router.include_router(todo_router)

__all__ = ["router"]
