export function formatElapsedSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function elapsedSince(isoStart: string, nowMs = Date.now()): number {
  return Math.max(0, (nowMs - new Date(isoStart).getTime()) / 1000);
}

export function playlistRemainingSeconds(
  elapsedSeconds: number,
  playlistMinutes: number,
): number {
  return playlistMinutes * 60 - elapsedSeconds;
}

export function sumBreakSeconds(breaks: number[]): number {
  return breaks.reduce((a, b) => a + b, 0);
}
