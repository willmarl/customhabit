import { cn } from "@/lib/utils";

type TallyCellProps = {
  checked: boolean;
  variant?: "default" | "empty" | "linked";
  onToggle?: () => void;
};

export default function TallyCell({
  checked,
  variant = "default",
  onToggle,
}: TallyCellProps) {
  const isInteractive = variant === "default" && onToggle != null;

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

  return (
    <button
      type="button"
      onClick={isInteractive ? onToggle : undefined}
      disabled={!isInteractive}
      className={cn(
        "size-7 shrink-0 rounded-sm border transition-colors duration-100",
        isInteractive &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60",
        !isInteractive && "cursor-default",
        checked
          ? "border-violet-300 bg-violet-400 dark:border-violet-500 dark:bg-violet-500"
          : "border-border/70 bg-background",
        isInteractive &&
          !checked &&
          "hover:border-violet-300 hover:bg-violet-100 dark:hover:border-violet-600 dark:hover:bg-violet-950/50",
        isInteractive &&
          checked &&
          "hover:border-violet-400 hover:bg-violet-500 dark:hover:bg-violet-400",
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
