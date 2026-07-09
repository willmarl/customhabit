import { kyClient } from "@/lib/kyClient";
import type {
  Board,
  Completion,
  CreateHabitRequest,
  CreateSubGroupRequest,
  DayActivity,
  DayRun,
  Habit,
  HabitGroup,
  HabitSession,
  ReorderHabitItem,
  StartSessionRequest,
  StopSessionRequest,
  TapOutRequest,
  ToggleCompletionRequest,
  UpdateDayRunRequest,
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
  kyClient
    .post("habits/completions/toggle", { json: data })
    .json<Completion | null>();

export const fetchDayActivity = (date?: string) =>
  kyClient
    .get("habits/sessions/activity", { searchParams: date ? { date } : {} })
    .json<DayActivity>();

export const fetchSessions = (date?: string) =>
  kyClient
    .get("habits/sessions", { searchParams: date ? { date } : {} })
    .json<HabitSession[]>();

export const startSession = (data: StartSessionRequest) =>
  kyClient.post("habits/sessions/start", { json: data }).json<HabitSession>();

export const stopSession = (data: StopSessionRequest) =>
  kyClient.post("habits/sessions/stop", { json: data }).json<HabitSession>();

export const fetchDayRun = (date?: string) =>
  kyClient
    .get("habits/day-run", { searchParams: date ? { date } : {} })
    .json<DayRun | null>();

export const updateDayRun = (data: UpdateDayRunRequest) =>
  kyClient.patch("habits/day-run", { json: data }).json<DayRun>();

export const tapOutDay = (data: TapOutRequest = {}) =>
  kyClient.post("habits/day-run/tap-out", { json: data }).json<DayRun>();
