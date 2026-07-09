import type { Completion, Habit } from "../types";

export type LinkedCellState =
  | { kind: "default" }
  | { kind: "empty" }
  | { kind: "linked"; checked: boolean };

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

  const completionSet = new Set(
    completions.map((c) => `${c.habit_id}:${c.date}`),
  );
  const allComplete = subHabits.every((h) =>
    completionSet.has(`${h.id}:${date}`),
  );

  return { kind: "linked", checked: allComplete };
}
