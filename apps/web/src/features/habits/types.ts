export type HabitGroupType = "core" | "sub";

export type AppSettings = {
  lookback_days: number;
  break_minutes: number;
  wake_time: string;
  bed_time: string;
  default_habit_minutes: number;
  playlist_minutes: number;
  loop_exempt_below_minutes: number;
};

export type AppSettingsUpdate = Partial<AppSettings>;

export type HabitGroup = {
  id: number;
  type: HabitGroupType;
  name: string;
  notes: string;
  sort_order: number;
  color: string;
};

export type Habit = {
  id: number;
  group_id: number;
  name: string;
  sort_order: number;
  linked_sub_group_id: number | null;
  duration_minutes: number;
  once_per_day: boolean;
};

export type Completion = {
  habit_id: number;
  date: string;
};

export type Board = {
  core_group: HabitGroup;
  sub_groups: HabitGroup[];
  habits: Habit[];
  completions: Completion[];
  settings: AppSettings;
};

export type CreateSubGroupRequest = { name: string };
export type UpdateGroupRequest = {
  name?: string;
  notes?: string;
  color?: string;
};
export type CreateHabitRequest = {
  group_id: number;
  name: string;
  duration_minutes?: number;
  once_per_day?: boolean;
};
export type UpdateHabitRequest = {
  name?: string;
  duration_minutes?: number;
  once_per_day?: boolean;
};
export type ReorderHabitItem = { id: number; sort_order: number };
export type ToggleCompletionRequest = { habit_id: number; date: string };

export type HabitSession = {
  id: number;
  habit_id: number;
  date: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  loop_index: number;
  source: string;
};

export type DayRun = {
  date: string;
  started_at: string | null;
  ended_at: string | null;
  tap_out_at: string | null;
  status: "active" | "completed" | "tap_out";
  mode: "normal" | "loop_30" | "in_zone";
  loop_count: number;
};

export type DayActivity = {
  day_run: DayRun | null;
  sessions: HabitSession[];
  active_session: HabitSession | null;
  break_seconds: number[];
};

export type StartSessionRequest = {
  habit_id: number;
  date?: string;
  loop_index?: number;
  source?: "manual" | "timer" | "toggle";
};

export type StopSessionRequest = { session_id: number };

export type UpdateDayRunRequest = {
  date: string;
  status?: DayRun["status"];
  mode?: DayRun["mode"];
  loop_count?: number;
  ended_at?: string;
};
