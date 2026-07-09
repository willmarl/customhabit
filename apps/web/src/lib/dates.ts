export function parseTimeMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function parseTimeOnDate(timeHHMM: string, base: Date): Date {
  const [h, m] = timeHHMM.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Anki-style habit day: before day_start counts as the previous calendar date. */
export function getHabitDate(now = new Date(), dayStartTime = "04:00"): string {
  const startMins = parseTimeMinutes(dayStartTime);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const d = new Date(now);
  if (nowMins < startMins) {
    d.setDate(d.getDate() - 1);
  }
  return formatDateISO(d);
}

/**
 * Next bedtime deadline from `from`.
 * Handles after-midnight bedtimes (e.g. 01:00 with wake at 07:00).
 */
export function resolveBedtime(bedTime: string, wakeTime: string, from: Date): Date {
  const bedMins = parseTimeMinutes(bedTime);
  const wakeMins = parseTimeMinutes(wakeTime);
  const fromMins = from.getHours() * 60 + from.getMinutes();
  const bedIsAfterMidnight = bedMins <= wakeMins;

  let bedAt = parseTimeOnDate(bedTime, from);

  if (bedIsAfterMidnight) {
    if (fromMins >= bedMins && fromMins < wakeMins) {
      bedAt = parseTimeOnDate(bedTime, from);
      bedAt.setDate(bedAt.getDate() + 1);
    } else if (fromMins >= wakeMins && bedAt <= from) {
      bedAt.setDate(bedAt.getDate() + 1);
    }
  } else if (bedAt <= from) {
    bedAt.setDate(bedAt.getDate() + 1);
  }

  return bedAt;
}

export function getVisibleDates(
  lookbackDays: number,
  dayStartTime = "04:00",
  now = new Date(),
): string[] {
  const end = new Date(getHabitDate(now, dayStartTime) + "T12:00:00");
  const dates: string[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(formatDateISO(d));
  }
  return dates;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return String(d.getDate());
}

export function formatMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short" });
}

export function isFirstOfMonth(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate() === 1;
}

export type BedComparison = {
  minutesPastBed: number;
  minutesBeforeBed: number;
  overtimeSeverity: "none" | "mild" | "moderate" | "severe";
};

export function compareFinishToBed(
  finishAt: Date,
  bedTime: string,
  wakeTime: string,
  from: Date,
): BedComparison {
  const bedAt = resolveBedtime(bedTime, wakeTime, from);

  let minutesPastBed = 0;
  let minutesBeforeBed = 0;
  if (finishAt > bedAt) {
    minutesPastBed = Math.ceil((finishAt.getTime() - bedAt.getTime()) / 60_000);
  } else {
    minutesBeforeBed = Math.floor((bedAt.getTime() - finishAt.getTime()) / 60_000);
  }

  let overtimeSeverity: BedComparison["overtimeSeverity"] = "none";
  if (minutesPastBed > 0) {
    if (minutesPastBed <= 15) overtimeSeverity = "mild";
    else if (minutesPastBed <= 45) overtimeSeverity = "moderate";
    else overtimeSeverity = "severe";
  }

  return { minutesPastBed, minutesBeforeBed, overtimeSeverity };
}
