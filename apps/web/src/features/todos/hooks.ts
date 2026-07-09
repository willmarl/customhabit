import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTodos, fetchTodoById, createTodo, updateTodo, deleteTodo } from "./api";
import type { TodoCreate, TodoUpdate } from "./types/todo";

const TODO_KEY = ["todos"];

export const useTodos = () =>
  useQuery({ queryKey: TODO_KEY, queryFn: fetchTodos });

export const useTodo = (id: number) =>
  useQuery({ queryKey: [...TODO_KEY, id], queryFn: () => fetchTodoById(id) });

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TodoCreate) => createTodo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODO_KEY }),
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TodoUpdate }) => updateTodo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODO_KEY }),
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TODO_KEY }),
  });
};
