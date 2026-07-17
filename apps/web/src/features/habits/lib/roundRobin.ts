import type { Habit } from "../types";

/** Parse YYYY-MM-DD as a UTC calendar day for stable day offsets. */
function parseIsoDateUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetweenUtc(fromIso: string, toIso: string): number {
  const from = parseIsoDateUtc(fromIso);
  const to = parseIsoDateUtc(toIso);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function isRoundRobinHabit(
  habit: Pick<Habit, "habit_type" | "linked_sub_group_id">,
): boolean {
  return habit.linked_sub_group_id == null && habit.habit_type === "round_robin";
}

export function resolveRoundRobinItem(
  habit: Pick<
    Habit,
    "habit_type" | "round_robin_items" | "round_robin_started_on" | "linked_sub_group_id"
  >,
  targetDate: string,
): string | null {
  if (!isRoundRobinHabit(habit)) return null;
  const items = habit.round_robin_items ?? [];
  const startedOn = habit.round_robin_started_on;
  if (items.length === 0 || !startedOn) return null;
  const offset = daysBetweenUtc(startedOn, targetDate);
  if (offset < 0) return null;
  return items[offset % items.length] ?? null;
}
