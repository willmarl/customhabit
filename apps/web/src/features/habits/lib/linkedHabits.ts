import type { Completion, Habit } from "../types";
import { getCellProgress, getCompletion, isCompletionDone } from "./completionUtils";

export type LinkedCellState =
  | { kind: "default" }
  | { kind: "empty" }
  | { kind: "linked"; progress: "none" | "partial" | "done" };

export function getLinkedCellState(
  habit: Habit,
  allHabits: Habit[],
  completions: Completion[],
  date: string,
): LinkedCellState {
  if (habit.linked_sub_group_id == null) {
    return { kind: "default" };
  }

  const subHabits = allHabits.filter(
    (h) => h.group_id === habit.linked_sub_group_id,
  );

  if (subHabits.length === 0) {
    return { kind: "empty" };
  }

  const progresses = subHabits.map((h) =>
    getCellProgress(getCompletion(completions, h.id, date)),
  );

  if (progresses.every((p) => p === "done")) {
    return { kind: "linked", progress: "done" };
  }
  if (progresses.some((p) => p === "partial" || p === "done")) {
    return { kind: "linked", progress: "partial" };
  }
  return { kind: "linked", progress: "none" };
}

export function isLinkedDone(
  habit: Habit,
  allHabits: Habit[],
  completions: Completion[],
  date: string,
): boolean {
  const state = getLinkedCellState(habit, allHabits, completions, date);
  return state.kind === "linked" && state.progress === "done";
}

export { isCompletionDone, getCellProgress, getCompletion };
