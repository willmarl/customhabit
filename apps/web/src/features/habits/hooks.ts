import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHabit,
  createSubGroup,
  deleteHabit,
  deleteSubGroup,
  fetchBoard,
  reorderHabits,
  toggleCompletion,
  updateGroup,
  updateHabit,
} from "./api";
import type {
  CreateHabitRequest,
  CreateSubGroupRequest,
  ReorderHabitItem,
  ToggleCompletionRequest,
  UpdateGroupRequest,
  UpdateHabitRequest,
} from "./types";

const BOARD_KEY = ["habits", "board"];

export const useBoard = () =>
  useQuery({ queryKey: BOARD_KEY, queryFn: fetchBoard });

export const useCreateSubGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubGroupRequest) => createSubGroup(data),
    onSuccess: (board) => queryClient.setQueryData(BOARD_KEY, board),
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGroupRequest }) =>
      updateGroup(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARD_KEY }),
  });
};

export const useDeleteSubGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSubGroup(id),
    onSuccess: (board) => queryClient.setQueryData(BOARD_KEY, board),
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHabitRequest) => createHabit(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARD_KEY }),
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHabitRequest }) =>
      updateHabit(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARD_KEY }),
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteHabit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARD_KEY }),
  });
};

export const useReorderHabits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderHabitItem[]) => reorderHabits(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOARD_KEY }),
  });
};

export const useToggleCompletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ToggleCompletionRequest) => toggleCompletion(data),
    onMutate: (data) => {
      void queryClient.cancelQueries({ queryKey: BOARD_KEY });
      const previous = queryClient.getQueryData<import("./types").Board>(BOARD_KEY);
      if (previous) {
        const exists = previous.completions.some(
          (c) => c.habit_id === data.habit_id && c.date === data.date,
        );
        queryClient.setQueryData(BOARD_KEY, {
          ...previous,
          completions: exists
            ? previous.completions.filter(
                (c) => !(c.habit_id === data.habit_id && c.date === data.date),
              )
            : [...previous.completions, { habit_id: data.habit_id, date: data.date }],
        });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(BOARD_KEY, context.previous);
      }
    },
  });
};
