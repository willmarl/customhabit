import { useTodos, useDeleteTodo, useUpdateTodo } from "@/features/todos/hooks";
import CreateTodoForm from "@/features/todos/components/CreateTodoForm";
import EditTodoForm from "@/features/todos/components/EditTodoForm";
import type { Todo } from "@/features/todos/types/todo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useModal } from "@/components/providers/ModalProvider";
import { ConfirmModal } from "@/components/modal/ConfirmModal";

export default function TodosPage() {
  const { data: todos, isLoading } = useTodos();
  const { mutate: deleteTodo } = useDeleteTodo();
  const { mutate: updateTodo } = useUpdateTodo();
  const { openModal, closeModal } = useModal();

  const handleCreate = () => {
    openModal({
      title: "Create Todo",
      content: <CreateTodoForm onSuccess={closeModal} />,
    });
  };

  const handleEdit = (todo: Todo) => {
    openModal({
      title: "Edit Todo",
      content: <EditTodoForm todo={todo} onSuccess={closeModal} />,
    });
  };

  const handleDelete = (todo: Todo) => {
    openModal({
      title: "Delete Todo",
      content: (
        <ConfirmModal
          message={`Are you sure you want to delete "${todo.title}"?`}
          onConfirm={() => deleteTodo(todo.id)}
          variant="destructive"
          buttonMessage="Delete"
        />
      ),
    });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos</h1>
        <Button onClick={handleCreate}>Create Todo</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {todos && todos.length === 0 && (
        <p className="text-muted-foreground">No todos yet. Create one!</p>
      )}

      {todos && todos.length > 0 && (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between border rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={todo.done}
                  onCheckedChange={() =>
                    updateTodo({
                      id: todo.id,
                      data: { title: todo.title, done: !todo.done },
                    })
                  }
                />
                <span
                  className={
                    todo.done ? "line-through text-muted-foreground" : ""
                  }
                >
                  {todo.title}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(todo)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(todo)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
