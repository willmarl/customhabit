import { formatSplitClock } from "./formatTimer";

/** Seconds until soft alarm for a habit focus session. */
export function ringAtSeconds(
  durationMinutes: number,
  bufferMinutes = 0,
): number {
  const buffer = Math.max(0, bufferMinutes);
  const ringMinutes = Math.max(1, durationMinutes - buffer);
  return ringMinutes * 60;
}

/** LiveSplit-style delta clock: elapsed − previous → ±M:SS.cc */
export function formatSplitDelta(
  elapsedSeconds: number,
  previousSeconds: number,
): string {
  const delta = elapsedSeconds - previousSeconds;
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "+";
  return `${sign}${formatSplitClock(Math.abs(delta))}`;
}

export function splitDeltaTone(
  elapsedSeconds: number,
  previousSeconds: number,
): "ahead" | "behind" | "even" {
  const d = elapsedSeconds - previousSeconds;
  if (d < 0) return "ahead";
  if (d > 0) return "behind";
  return "even";
}

export function previousDurationFor(
  previousDurations: Record<string, number> | undefined,
  habitId: number,
): number | null {
  if (!previousDurations) return null;
  const raw =
    previousDurations[String(habitId)] ??
    previousDurations[habitId as unknown as string];
  if (raw == null || !Number.isFinite(raw)) return null;
  return raw;
}
