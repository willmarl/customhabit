import { kyClient } from "@/lib/kyClient";
import type {
  Board,
  CreateHabitRequest,
  CreateSubGroupRequest,
  Habit,
  HabitGroup,
  ReorderHabitItem,
  ToggleCompletionRequest,
  UpdateGroupRequest,
  UpdateHabitRequest,
} from "./types";

export const fetchBoard = () => kyClient.get("habits/board").json<Board>();

export const createSubGroup = (data: CreateSubGroupRequest) =>
  kyClient.post("habits/groups/sub", { json: data }).json<Board>();

export const updateGroup = (id: number, data: UpdateGroupRequest) =>
  kyClient.patch(`habits/groups/${id}`, { json: data }).json<HabitGroup>();

export const deleteSubGroup = (id: number) =>
  kyClient.delete(`habits/groups/${id}`).json<Board>();

export const createHabit = (data: CreateHabitRequest) =>
  kyClient.post("habits", { json: data }).json<Habit>();

export const updateHabit = (id: number, data: UpdateHabitRequest) =>
  kyClient.patch(`habits/${id}`, { json: data }).json<Habit>();

export const deleteHabit = (id: number) =>
  kyClient.delete(`habits/${id}`);

export const reorderHabits = (items: ReorderHabitItem[]) =>
  kyClient.put("habits/reorder", { json: { items } });

export const toggleCompletion = (data: ToggleCompletionRequest) =>
  kyClient.post("habits/completions/toggle", { json: data }).json<{ habit_id: number; date: string } | null>();
