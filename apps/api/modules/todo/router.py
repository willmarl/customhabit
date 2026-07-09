from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from .schemas import Todo, TodoCreate, TodoUpdate
from .service import TodoService
from db import get_session

router = APIRouter(prefix="/todos", tags=["todos"])


def get_todo_service(session: Session = Depends(get_session)) -> TodoService:
    return TodoService(session)


@router.post("", response_model=Todo)
async def create_todo(todo: TodoCreate, service: TodoService = Depends(get_todo_service)):
    return service.create(todo)


@router.get("", response_model=list[Todo])
async def get_todos(service: TodoService = Depends(get_todo_service)):
    return service.get_all()


@router.get("/{todo_id}", response_model=Todo)
async def get_todo(todo_id: int, service: TodoService = Depends(get_todo_service)):
    todo = service.get_by_id(todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.patch("/{todo_id}", response_model=Todo)
async def update_todo(todo_id: int, data: TodoUpdate, service: TodoService = Depends(get_todo_service)):
    todo = service.update(todo_id, data)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.delete("/{todo_id}", status_code=204)
async def delete_todo(todo_id: int, service: TodoService = Depends(get_todo_service)):
    if not service.delete(todo_id):
        raise HTTPException(status_code=404, detail="Todo not found")
