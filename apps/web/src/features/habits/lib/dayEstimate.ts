import { compareFinishToBed, parseTimeOnDate, resolveBedtime } from "@/lib/dates";
import type { Board, Habit } from "../types";

export type StackHabit = Pick<Habit, "id" | "duration_minutes" | "once_per_day" | "name">;

/** Core execution order: linked rows expand into their sub-habits. */
export function getStackHabits(board: Board): StackHabit[] {
  const coreHabits = board.habits
    .filter((h) => h.group_id === board.core_group.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const items: StackHabit[] = [];

  for (const habit of coreHabits) {
    if (habit.linked_sub_group_id != null) {
      const subHabits = board.habits
        .filter((h) => h.group_id === habit.linked_sub_group_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      items.push(...subHabits);
    } else {
      items.push(habit);
    }
  }

  return items;
}

export function formatDurationMinutes(
  minutes: number,
  style: "short" | "long" = "short",
): string {
  const total = Math.ceil(Math.max(0, minutes));
  if (total < 60) {
    return `${total}m`;
  }

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const hr = style === "long" ? "hr" : "h";

  if (mins === 0) {
    return hours === 1 ? `1${hr}` : `${hours}${hr}`;
  }

  const hourPart = hours === 1 ? `1${hr}` : `${hours}${hr}`;
  return `${hourPart} ${mins}m`;
}

export function estimateDayMinutes(board: Board): number {
  const items = getStackHabits(board);
  if (items.length === 0) return 0;

  const habitMinutes = items.reduce((sum, h) => sum + h.duration_minutes, 0);
  const breaks = Math.max(0, items.length - 1) * board.settings.break_minutes;
  return habitMinutes + breaks;
}

export type DayEstimate = {
  totalMinutes: number;
  habitCount: number;
  finishAt: Date;
  bedAt: Date;
  minutesPastBed: number;
  minutesBeforeBed: number;
  overtimeSeverity: "none" | "mild" | "moderate" | "severe";
};

export function computeDayEstimate(board: Board, now = new Date()): DayEstimate {
  const items = getStackHabits(board);
  const totalMinutes = estimateDayMinutes(board);
  const finishAt = new Date(now.getTime() + totalMinutes * 60_000);
  const { bed_time, wake_time } = board.settings;
  const bedAt = resolveBedtime(bed_time, wake_time, now);
  const bedCompare = compareFinishToBed(finishAt, bed_time, wake_time, now);

  return {
    totalMinutes,
    habitCount: items.length,
    finishAt,
    bedAt,
    minutesPastBed: bedCompare.minutesPastBed,
    minutesBeforeBed: bedCompare.minutesBeforeBed,
    overtimeSeverity: bedCompare.overtimeSeverity,
  };
}

export function formatFinishTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Re-export for any callers that used parseTimeOnDate from here.
export { parseTimeOnDate, resolveBedtime };
