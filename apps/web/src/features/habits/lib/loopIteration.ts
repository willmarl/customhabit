import { getStackHabits } from "./dayEstimate";
import { getCompletion } from "./completionUtils";
import type { AppSettings, Board, Completion, Habit } from "../types";

export type LoopIterationDisplay = {
  current: number;
  total: number;
};

/** Assumed loop target when frontend loop view is on (ignores backend normal mode). */
export function getAssumedLoopsTarget(
  habit: Pick<Habit, "duration_minutes" | "once_per_day">,
  settings: AppSettings,
): number {
  if (habit.once_per_day) return 1;
  if (habit.duration_minutes < settings.loop_exempt_below_minutes) return 1;
  return 2;
}

function getEffectiveLoopsTarget(
  habit: Pick<Habit, "duration_minutes" | "once_per_day">,
  completion: Completion | undefined,
  settings: AppSettings,
  loopUiEnabled: boolean,
): number {
  if (completion && completion.loops_target >= 2) {
    return completion.loops_target;
  }
  if (!loopUiEnabled) {
    return completion?.loops_target ?? 1;
  }
  return getAssumedLoopsTarget(habit, settings);
}

/**
 * Conservative loop position: driven by the slowest multi-loop habit.
 * e.g. nine habits at full + one at half still reads as loop 1 of 2.
 */
export function computeLoopIterationDisplay(
  board: Board,
  completions: Completion[],
  today: string,
  loopUiEnabled: boolean,
): LoopIterationDisplay | null {
  if (!loopUiEnabled || board.day_run?.status === "tap_out") {
    return null;
  }

  const total = board.day_run?.loop_count ?? 2;
  const stack = getStackHabits(board);

  const multiLoop = stack.filter((habit) => {
    const c = getCompletion(completions, habit.id, today);
    return getEffectiveLoopsTarget(habit, c, board.settings, true) >= 2;
  });

  if (multiLoop.length === 0) {
    return null;
  }

  let minDone = total;
  for (const habit of multiLoop) {
    const c = getCompletion(completions, habit.id, today);
    const done = c?.loops_done ?? 0;
    minDone = Math.min(minDone, done);
  }

  const current = minDone >= total ? total : Math.max(1, minDone);
  return { current, total };
}
