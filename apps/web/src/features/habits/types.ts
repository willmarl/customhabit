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
