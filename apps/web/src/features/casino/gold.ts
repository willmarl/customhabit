/** Matches apps/api/modules/casino/logic.py gold_chance. */
export function goldChance(durationMinutes: number): number {
  const raw = (0.04 * durationMinutes) / 10;
  return Math.min(0.2, Math.max(0.02, raw));
}

export function formatGoldChance(durationMinutes: number): string {
  const percent = goldChance(durationMinutes) * 100;
  const rounded = Math.round(percent * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}
