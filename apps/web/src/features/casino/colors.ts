export const TOKEN_COLORS: Record<string, string> = {
  rose: "#e11d48",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  gold: "#f6c945",
};

export function tokenColor(name: string): string {
  return TOKEN_COLORS[name] ?? "#a8a29e";
}
