import type { DayStat } from "../types";

/** Week columns the library renders (Sunday week start, padded). */
export function weekColumnCount(days: DayStat[], weekStart = 0): number {
  if (days.length === 0) return 0;
  const first = new Date(days[0].date + "T12:00:00");
  const pad = (first.getDay() - weekStart + 7) % 7;
  return Math.ceil((pad + days.length) / 7);
}

const LABEL_GUTTER = 36;
const MIN_BLOCK = 9;
const MAX_BLOCK = 14;

export function blockSizeForWidth(
  containerWidth: number,
  weekCount: number,
  blockMargin: number,
): number {
  if (weekCount <= 0 || containerWidth <= LABEL_GUTTER) return MIN_BLOCK;
  const columnWidth = (containerWidth - LABEL_GUTTER) / weekCount;
  const size = Math.floor(columnWidth - blockMargin);
  return Math.max(MIN_BLOCK, Math.min(MAX_BLOCK, size));
}
