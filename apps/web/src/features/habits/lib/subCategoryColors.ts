import type { CSSProperties } from "react";

export type SubCategoryColorId =
  | "rose"
  | "orange"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "slate";

export type SubCategoryColorStyles = {
  text?: CSSProperties;
  textLinked?: CSSProperties;
  tallyChecked?: CSSProperties;
  tallyCheckedLinked?: CSSProperties;
  swatch?: CSSProperties;
};

export type SubCategoryColor = {
  id: string;
  label: string;
  text: string;
  textLinked: string;
  tallyChecked: string;
  tallyCheckedLinked: string;
  tallyHover: string;
  tallyHoverChecked: string;
  swatch: string;
  styles?: SubCategoryColorStyles;
};

export const SUB_CATEGORY_COLORS: SubCategoryColor[] = [
  {
    id: "rose",
    label: "Rose",
    text: "text-rose-600 dark:text-rose-400",
    textLinked: "text-rose-400 dark:text-rose-300",
    tallyChecked:
      "border-rose-400 bg-rose-500 dark:border-rose-500 dark:bg-rose-500",
    tallyCheckedLinked:
      "border-rose-300 bg-rose-400 dark:border-rose-400 dark:bg-rose-400",
    tallyHover: "hover:border-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50",
    tallyHoverChecked: "hover:border-rose-500 hover:bg-rose-600",
    swatch: "bg-rose-500",
  },
  {
    id: "orange",
    label: "Orange",
    text: "text-orange-600 dark:text-orange-400",
    textLinked: "text-orange-400 dark:text-orange-300",
    tallyChecked:
      "border-orange-400 bg-orange-400 dark:border-orange-500 dark:bg-orange-500",
    tallyCheckedLinked:
      "border-orange-300 bg-orange-300 dark:border-orange-400 dark:bg-orange-400",
    tallyHover: "hover:border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/50",
    tallyHoverChecked: "hover:border-orange-400 hover:bg-orange-500",
    swatch: "bg-orange-400",
  },
  {
    id: "green",
    label: "Green",
    text: "text-green-600 dark:text-green-400",
    textLinked: "text-green-400 dark:text-green-300",
    tallyChecked:
      "border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-500",
    tallyCheckedLinked:
      "border-green-300 bg-green-400 dark:border-green-400 dark:bg-green-400",
    tallyHover: "hover:border-green-300 hover:bg-green-100 dark:hover:bg-green-950/50",
    tallyHoverChecked: "hover:border-green-500 hover:bg-green-600",
    swatch: "bg-green-500",
  },
  {
    id: "teal",
    label: "Teal",
    text: "text-teal-600 dark:text-teal-400",
    textLinked: "text-teal-400 dark:text-teal-300",
    tallyChecked:
      "border-teal-400 bg-teal-500 dark:border-teal-500 dark:bg-teal-500",
    tallyCheckedLinked:
      "border-teal-300 bg-teal-400 dark:border-teal-400 dark:bg-teal-400",
    tallyHover: "hover:border-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/50",
    tallyHoverChecked: "hover:border-teal-500 hover:bg-teal-600",
    swatch: "bg-teal-500",
  },
  {
    id: "blue",
    label: "Blue",
    text: "text-blue-600 dark:text-blue-400",
    textLinked: "text-blue-400 dark:text-blue-300",
    tallyChecked:
      "border-blue-400 bg-blue-500 dark:border-blue-500 dark:bg-blue-500",
    tallyCheckedLinked:
      "border-blue-300 bg-blue-400 dark:border-blue-400 dark:bg-blue-400",
    tallyHover: "hover:border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50",
    tallyHoverChecked: "hover:border-blue-500 hover:bg-blue-600",
    swatch: "bg-blue-500",
  },
  {
    id: "violet",
    label: "Violet",
    text: "text-violet-600 dark:text-violet-400",
    textLinked: "text-violet-400 dark:text-violet-300",
    tallyChecked:
      "border-violet-400 bg-violet-500 dark:border-violet-500 dark:bg-violet-500",
    tallyCheckedLinked:
      "border-violet-300 bg-violet-400 dark:border-violet-400 dark:bg-violet-400",
    tallyHover: "hover:border-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/50",
    tallyHoverChecked: "hover:border-violet-500 hover:bg-violet-600",
    swatch: "bg-violet-500",
  },
  {
    id: "slate",
    label: "Slate",
    text: "text-slate-600 dark:text-slate-400",
    textLinked: "text-slate-400 dark:text-slate-300",
    tallyChecked:
      "border-slate-400 bg-slate-500 dark:border-slate-500 dark:bg-slate-500",
    tallyCheckedLinked:
      "border-slate-300 bg-slate-400 dark:border-slate-400 dark:bg-slate-400",
    tallyHover: "hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-950/50",
    tallyHoverChecked: "hover:border-slate-500 hover:bg-slate-600",
    swatch: "bg-slate-500",
  },
];

const DEFAULT_CORE_COLOR = SUB_CATEGORY_COLORS.find((c) => c.id === "violet")!;

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(color?: string | null): boolean {
  return !!color && HEX_COLOR_RE.test(color);
}

function buildCustomSubCategoryColor(hex: string): SubCategoryColor {
  const linkedText = `color-mix(in srgb, ${hex} 62%, white)`;
  const linkedFill = `color-mix(in srgb, ${hex} 52%, white)`;

  return {
    id: hex,
    label: "Custom",
    text: "",
    textLinked: "",
    tallyChecked: "",
    tallyCheckedLinked: "",
    tallyHover: "hover:opacity-80",
    tallyHoverChecked: "hover:opacity-90",
    swatch: "",
    styles: {
      text: { color: hex },
      textLinked: { color: linkedText },
      swatch: { backgroundColor: hex },
      tallyChecked: { backgroundColor: hex, borderColor: hex },
      tallyCheckedLinked: {
        backgroundColor: linkedFill,
        borderColor: linkedText,
      },
    },
  };
}

export function getSubCategoryColor(colorId?: string | null): SubCategoryColor {
  if (isHexColor(colorId)) {
    return buildCustomSubCategoryColor(colorId!);
  }
  return (
    SUB_CATEGORY_COLORS.find((c) => c.id === colorId) ??
    SUB_CATEGORY_COLORS.find((c) => c.id === "orange")!
  );
}

export function getCoreHabitColor(): SubCategoryColor {
  return DEFAULT_CORE_COLOR;
}

export const RAINBOW_SWATCH_CLASS =
  "bg-[conic-gradient(from_0deg,#ef4444,#f97316,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)]";
