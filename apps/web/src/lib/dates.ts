export function getVisibleDates(lookbackDays: number, anchorDate = new Date()): string[] {
  const dates: string[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const d = new Date(anchorDate);
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
