import type { AppSettings, Board, Completion, DayRun, Habit } from "../types";

export type CellProgress = "none" | "partial" | "done";

export function getLoopsTarget(
  habit: Pick<Habit, "duration_minutes" | "once_per_day">,
  dayRun: DayRun | null | undefined,
  settings: AppSettings,
): number {
  if (habit.once_per_day) return 1;
  if (!dayRun || dayRun.mode === "normal") return 1;
  if (dayRun.mode === "half") return 2;
  if (habit.duration_minutes < settings.loop_exempt_below_minutes) return 1;
  return dayRun.loop_count > 0 ? dayRun.loop_count : 2;
}

export function isCompletionDone(c: Completion | undefined): boolean {
  if (!c) return false;
  return c.loops_done >= c.loops_target;
}

export function getCellProgress(c: Completion | undefined): CellProgress {
  if (!c || c.loops_done <= 0) return "none";
  if (c.loops_done >= c.loops_target) return "done";
  return "partial";
}

export function getCompletion(
  completions: Completion[],
  habitId: number,
  date: string,
): Completion | undefined {
  return completions.find((c) => c.habit_id === habitId && c.date === date);
}

/** Minutes left in today's stack given loop progress. */
export function estimateRemainingMinutes(
  board: Board,
  completions: Completion[],
  today: string,
): number {
  if (board.day_run?.status === "tap_out") return 0;

  const habits = board.habits;
  const coreHabits = habits
    .filter((h) => h.group_id === board.core_group.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const stack: Habit[] = [];
  for (const h of coreHabits) {
    if (h.linked_sub_group_id != null) {
      stack.push(
        ...habits
          .filter((x) => x.group_id === h.linked_sub_group_id)
          .sort((a, b) => a.sort_order - b.sort_order),
      );
    } else {
      stack.push(h);
    }
  }

  let total = 0;
  let remainingCount = 0;
  const loopSessionMinutes = 30;

  for (const habit of stack) {
    const c = getCompletion(completions, habit.id, today);
    const target = getLoopsTarget(habit, board.day_run, board.settings);
    const done = c?.loops_done ?? 0;
    const loopsLeft = Math.max(0, target - done);
    if (loopsLeft === 0) continue;

    if (board.day_run?.mode === "half" && target > 1) {
      total += habit.duration_minutes * (loopsLeft / target);
    } else {
      const perLoop =
        board.day_run?.mode === "loop_30" && target > 1
          ? Math.min(loopSessionMinutes, habit.duration_minutes)
          : habit.duration_minutes;
      total += perLoop * loopsLeft;
    }
    remainingCount += 1;
  }

  if (remainingCount > 1) {
    total += (remainingCount - 1) * board.settings.break_minutes;
  }
  return total;
}

export function allStackHabitsDone(
  board: Board,
  completions: Completion[],
  today: string,
): boolean {
  const habits = board.habits;
  const coreHabits = habits
    .filter((h) => h.group_id === board.core_group.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  for (const h of coreHabits) {
    if (h.linked_sub_group_id != null) {
      const subs = habits.filter((x) => x.group_id === h.linked_sub_group_id);
      if (subs.length === 0) continue;
      if (!subs.every((s) => isCompletionDone(getCompletion(completions, s.id, today)))) {
        return false;
      }
    } else if (!isCompletionDone(getCompletion(completions, h.id, today))) {
      return false;
    }
  }
  return coreHabits.length > 0;
}
