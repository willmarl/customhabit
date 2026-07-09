from sqlmodel import Session, select
from .schemas import Todo, TodoCreate, TodoUpdate


class TodoService:
    def __init__(self, session: Session):
        self.session = session

    def create(self, todo: TodoCreate) -> Todo:
        db_todo = Todo.model_validate(todo)
        self.session.add(db_todo)
        self.session.commit()
        self.session.refresh(db_todo)
        return db_todo

    def get_all(self) -> list[Todo]:
        return list(self.session.exec(select(Todo)).all())

    def get_by_id(self, todo_id: int) -> Todo | None:
        return self.session.get(Todo, todo_id)

    def update(self, todo_id: int, data: TodoUpdate) -> Todo | None:
        db_todo = self.session.get(Todo, todo_id)
        if not db_todo:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(db_todo, key, value)
        self.session.add(db_todo)
        self.session.commit()
        self.session.refresh(db_todo)
        return db_todo

    def delete(self, todo_id: int) -> bool:
        db_todo = self.session.get(Todo, todo_id)
        if not db_todo:
            return False
        self.session.delete(db_todo)
        self.session.commit()
        return True
