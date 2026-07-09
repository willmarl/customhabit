import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHabit,
  createSubGroup,
  deleteHabit,
  deleteSubGroup,
  fetchBoard,
  fetchDayActivity,
  reorderHabits,
  startSession,
  stopSession,
  tapOutDay,
  toggleCompletion,
  updateGroup,
  updateDayRun,
  updateHabit,
} from "./api";
import type {
  CreateHabitRequest,
  CreateSubGroupRequest,
  ReorderHabitItem,
  StartSessionRequest,
  StopSessionRequest,
  TapOutRequest,
  ToggleCompletionRequest,
  UpdateDayRunRequest,
  UpdateGroupRequest,
  UpdateHabitRequest,
} from "./types";
import { getHabitDate } from "@/lib/dates";

const BOARD_KEY = ["habits", "board"];
const today = () => getHabitDate();
const activityKey = (date?: string) => ["habits", "activity", date ?? today()];

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEY });
    },
  });
};

export const useDayActivity = (date?: string) =>
  useQuery({
    queryKey: activityKey(date),
    queryFn: () => fetchDayActivity(date),
    refetchInterval: (query) =>
      query.state.data?.active_session ? 1000 : false,
  });

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartSessionRequest) => startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKey() });
    },
  });
};

export const useStopSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StopSessionRequest) => stopSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKey() });
    },
  });
};

export const useUpdateDayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDayRunRequest) => updateDayRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEY });
      queryClient.invalidateQueries({ queryKey: activityKey() });
    },
  });
};

export const useTapOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TapOutRequest) => tapOutDay(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEY });
    },
  });
};
