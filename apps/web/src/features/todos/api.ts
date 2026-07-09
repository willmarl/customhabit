import { kyClient } from "@/lib/kyClient";
import type { Todo, TodoCreate, TodoUpdate } from "./types/todo";

export const fetchTodos = () =>
  kyClient.get("todos").json<Todo[]>();

export const fetchTodoById = (id: number) =>
  kyClient.get(`todos/${id}`).json<Todo>();

export const createTodo = (data: TodoCreate) =>
  kyClient.post("todos", { json: data }).json<Todo>();

export const updateTodo = (id: number, data: TodoUpdate) =>
  kyClient.patch(`todos/${id}`, { json: data }).json<Todo>();

export const deleteTodo = (id: number) =>
  kyClient.delete(`todos/${id}`);
