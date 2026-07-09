import { cn } from "@/lib/utils";
import type { SubCategoryColor } from "../lib/subCategoryColors";
import { getCoreHabitColor } from "../lib/subCategoryColors";

type TallyCellProps = {
  checked: boolean;
  variant?: "default" | "empty" | "linked";
  accentColor?: SubCategoryColor;
  accentTone?: "full" | "linked";
  onToggle?: () => void;
};

export default function TallyCell({
  checked,
  variant = "default",
  accentColor,
  accentTone = "full",
  onToggle,
}: TallyCellProps) {
  const isInteractive = variant === "default" && onToggle != null;
  const color = accentColor ?? (variant === "default" ? getCoreHabitColor() : undefined);

  if (variant === "empty") {
    return (
      <div
        className={cn(
          "size-7 shrink-0 rounded-sm border border-border/50",
          "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,var(--color-border)_4px,var(--color-border)_5px)]",
          "opacity-60",
        )}
        aria-label="No habits in linked sub-category"
      />
    );
  }

  const checkedClass =
    accentTone === "linked"
      ? color?.tallyCheckedLinked
      : color?.tallyChecked;

  const checkedStyle =
    accentTone === "linked"
      ? color?.styles?.tallyCheckedLinked
      : color?.styles?.tallyChecked;

  return (
    <button
      type="button"
      onClick={isInteractive ? onToggle : undefined}
      disabled={!isInteractive}
      style={checked ? checkedStyle : undefined}
      className={cn(
        "size-7 shrink-0 rounded-sm border transition-colors duration-100",
        isInteractive && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        !isInteractive && "cursor-default",
        checked && checkedClass,
        !checked && "border-border/70 bg-background",
        isInteractive && !checked && color?.tallyHover,
        isInteractive && checked && color?.tallyHoverChecked,
      )}
      aria-label={
        variant === "linked"
          ? checked
            ? "All sub-category habits complete"
            : "Sub-category habits incomplete"
          : checked
            ? "Mark incomplete"
            : "Mark complete"
      }
      aria-pressed={checked}
    />
  );
}
