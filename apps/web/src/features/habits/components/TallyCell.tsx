import { cn } from "@/lib/utils";
import { IconTooltipWrap } from "@/components/ui/icon-tooltip";
import type { SubCategoryColor } from "../lib/subCategoryColors";
import { getCoreHabitColor } from "../lib/subCategoryColors";
import type { CellProgress } from "../lib/completionUtils";

type TallyCellProps = {
  progress?: CellProgress;
  /** @deprecated use progress */
  checked?: boolean;
  variant?: "default" | "empty" | "linked";
  accentColor?: SubCategoryColor;
  accentTone?: "full" | "linked";
  tooltip?: string;
  onToggle?: () => void;
};

export default function TallyCell({
  progress,
  checked,
  variant = "default",
  accentColor,
  accentTone = "full",
  tooltip,
  onToggle,
}: TallyCellProps) {
  const resolved: CellProgress =
    progress ?? (checked ? "done" : "none");
  const isInteractive = variant === "default" && onToggle != null;
  const isLinked = variant === "linked" || (variant === "empty" && tooltip != null);
  const color = accentColor ?? (variant === "default" ? getCoreHabitColor() : undefined);

  if (variant === "empty") {
    const emptyCell = (
      <div
        className={cn(
          "size-7 shrink-0 rounded-sm border border-border/50",
          "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,var(--color-border)_4px,var(--color-border)_5px)]",
          "opacity-60",
          isLinked && "cursor-help",
        )}
        aria-label="No habits in linked sub-category"
      />
    );

    if (tooltip) {
      return (
        <IconTooltipWrap tooltip={tooltip}>
          <span className="inline-flex cursor-help">{emptyCell}</span>
        </IconTooltipWrap>
      );
    }

    return emptyCell;
  }

  const checkedClass =
    accentTone === "linked"
      ? color?.tallyCheckedLinked
      : color?.tallyChecked;

  const checkedStyle =
    accentTone === "linked"
      ? color?.styles?.tallyCheckedLinked
      : color?.styles?.tallyChecked;

  const isDone = resolved === "done";
  const isPartial = resolved === "partial";

  const cell = (
    <button
      type="button"
      onClick={isInteractive ? onToggle : undefined}
      disabled={!isInteractive}
      style={isDone ? checkedStyle : undefined}
      className={cn(
        "relative size-7 shrink-0 overflow-hidden rounded-sm border transition-colors duration-100",
        isInteractive && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        !isInteractive && isLinked && "cursor-help",
        !isInteractive && !isLinked && "cursor-default",
        isDone && checkedClass,
        !isDone && "border-border bg-card",
        isInteractive && !isDone && color?.tallyHover,
        isInteractive && isDone && color?.tallyHoverChecked,
      )}
      aria-label={
        variant === "linked"
          ? isDone
            ? "All sub-category habits complete"
            : isPartial
              ? "Sub-category partially complete"
              : "Sub-category habits incomplete"
          : isDone
            ? "Mark incomplete"
            : isPartial
              ? "Mark next loop complete"
              : "Mark complete"
      }
      aria-pressed={isDone || isPartial}
    >
      {isPartial && (
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 h-1/2",
            accentTone === "linked" ? color?.tallyCheckedLinked : color?.tallyChecked,
          )}
          style={
            accentTone === "linked"
              ? color?.styles?.tallyCheckedLinked
              : color?.styles?.tallyChecked
          }
          aria-hidden
        />
      )}
    </button>
  );

  if (tooltip) {
    return (
      <IconTooltipWrap tooltip={tooltip}>
        <span className="inline-flex cursor-help">{cell}</span>
      </IconTooltipWrap>
    );
  }

  return cell;
}
