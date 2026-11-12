const PATTERN = ["T1", "T2", "T1", "T3", "T1", "T2", "BONUS", "T1", "T2", "T3"];

export const MAIN_SLICES: string[] = Array.from({ length: 5 }, () => [...PATTERN]).flat();
MAIN_SLICES[46] = "JACKPOT";

export const MAIN_SLICE_COLORS: Record<string, string> = {
  T1: "#475569",
  T2: "#0f766e",
  T3: "#6d28d9",
  BONUS: "#d97706",
  JACKPOT: "#e11d48",
};

export type WheelSlice = {
  id: string;
  label: string;
  color: string;
  weight: number;
};

export const BONUS_SLICES: WheelSlice[] = [
  { id: "75", label: "75%", color: "#e11d48", weight: 40 },
  { id: "50", label: "50%", color: "#7c3aed", weight: 25 },
  { id: "EXTRA", label: "EXTRA", color: "#eab308", weight: 18 },
  { id: "25", label: "25%", color: "#a8a29e", weight: 12 },
  { id: "FREE", label: "FREE", color: "#16a34a", weight: 5 },
];

export function mainWheelSlices(): WheelSlice[] {
  return MAIN_SLICES.map((id, index) => ({
    id: `${id}-${index}`,
    label: id === "JACKPOT" ? "JACK" : id,
    color: MAIN_SLICE_COLORS[id] ?? "#475569",
    weight: 1,
  }));
}

export function sliceSpans(weights: number[]): { start: number; span: number; center: number }[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let acc = 0;
  return weights.map((weight) => {
    const span = (weight / total) * 360;
    const start = acc;
    const center = acc + span / 2;
    acc += span;
    return { start, span, center };
  });
}
