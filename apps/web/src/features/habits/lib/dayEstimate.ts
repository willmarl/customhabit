import type { AppSettings, Board, Habit } from "../types";

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
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
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

function parseTimeOnDate(timeHHMM: string, base: Date): Date {
  const [h, m] = timeHHMM.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export type DayEstimate = {
  totalMinutes: number;
  habitCount: number;
  finishAt: Date;
  bedAt: Date;
  minutesPastBed: number;
  overtimeSeverity: "none" | "mild" | "moderate" | "severe";
};

export function computeDayEstimate(board: Board, now = new Date()): DayEstimate {
  const items = getStackHabits(board);
  const totalMinutes = estimateDayMinutes(board);
  const finishAt = new Date(now.getTime() + totalMinutes * 60_000);
  const bedAt = parseTimeOnDate(board.settings.bed_time, now);

  let minutesPastBed = 0;
  if (finishAt > bedAt) {
    minutesPastBed = Math.ceil((finishAt.getTime() - bedAt.getTime()) / 60_000);
  }

  let overtimeSeverity: DayEstimate["overtimeSeverity"] = "none";
  if (minutesPastBed > 0) {
    if (minutesPastBed <= 15) overtimeSeverity = "mild";
    else if (minutesPastBed <= 45) overtimeSeverity = "moderate";
    else overtimeSeverity = "severe";
  }

  return {
    totalMinutes,
    habitCount: items.length,
    finishAt,
    bedAt,
    minutesPastBed,
    overtimeSeverity,
  };
}

export function formatFinishTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
