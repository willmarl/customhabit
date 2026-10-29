export type HabitGroupType = "core" | "sub";

export type AppSettings = {
  lookback_days: number;
  break_minutes: number;
  wake_time: string;
  bed_time: string;
  day_start_time: string;
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

export type HabitType = "normal" | "round_robin";

export type Habit = {
  id: number;
  group_id: number;
  name: string;
  sort_order: number;
  linked_sub_group_id: number | null;
  duration_minutes: number;
  buffer_minutes?: number;
  once_per_day: boolean;
  retired_at?: string | null;
  habit_type?: HabitType;
  round_robin_items?: string[];
  round_robin_started_on?: string | null;
};

export type RetiredHabit = Habit & {
  group_name: string;
  retired_at: string;
};

export type RetiredHabits = {
  habits: RetiredHabit[];
  completions: Completion[];
};

export type Completion = {
  habit_id: number;
  date: string;
  loops_done: number;
  loops_target: number;
  status: "pending" | "partial" | "done" | "skipped_in_zone";
};

export type DayRun = {
  date: string;
  started_at: string | null;
  ended_at: string | null;
  tap_out_at: string | null;
  status: "active" | "completed" | "tap_out";
  mode: "normal" | "half" | "loop_30" | "in_zone";
  loop_count: number;
};

export type Board = {
  core_group: HabitGroup;
  sub_groups: HabitGroup[];
  habits: Habit[];
  completions: Completion[];
  settings: AppSettings;
  day_run: DayRun | null;
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
  buffer_minutes?: number;
  once_per_day?: boolean;
  habit_type?: HabitType;
  round_robin_items?: string[];
};
export type UpdateHabitRequest = {
  name?: string;
  duration_minutes?: number;
  buffer_minutes?: number;
  once_per_day?: boolean;
  habit_type?: HabitType;
  round_robin_items?: string[];
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

export type TapOutRequest = { date?: string };

export type DayActivity = {
  day_run: DayRun | null;
  sessions: HabitSession[];
  active_session: HabitSession | null;
  break_seconds: number[];
  /** habit_id -> previous timer duration_seconds (JSON keys may be strings) */
  previous_durations?: Record<string, number>;
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

export type SnapshotPayload = {
  core_group: HabitGroup;
  sub_groups: HabitGroup[];
  habits: Habit[];
};

export type SnapshotSummary = {
  id: number;
  name: string;
  created_at: string;
};

export type SnapshotDetail = SnapshotSummary & {
  payload: SnapshotPayload;
};

export type CreateSnapshotRequest = { name: string };

export type DayStat = {
  date: string;
  habits_done: number;
  stack_complete: boolean;
};

export type StatsSummary = {
  from_date: string;
  to_date: string;
  days: DayStat[];
  max_habits_in_day: number;
  lifetime_habits_done: number;
  current_streak: number;
  longest_streak: number;
  longest_true_streak: number;
};
