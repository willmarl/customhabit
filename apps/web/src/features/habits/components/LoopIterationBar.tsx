import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getHabitDate } from "@/lib/dates";
import type { Board, Completion } from "../types";
import { computeLoopIterationDisplay } from "../lib/loopIteration";

type LoopIterationBarProps = {
  board: Board;
  completions: Completion[];
  enabled: boolean;
  onToggle: () => void;
};

export default function LoopIterationBar({
  board,
  completions,
  enabled,
  onToggle,
}: LoopIterationBarProps) {
  const today = getHabitDate(new Date(), board.settings.day_start_time);

  const iteration = useMemo(
    () => computeLoopIterationDisplay(board, completions, today, enabled),
    [board, completions, today, enabled],
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
      <Button
        type="button"
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className="h-8"
        title="Show which loop you are on (display only)"
      >
        Loop view
      </Button>
      {iteration && (
        <p
          className={cn(
            "font-medium tabular-nums tracking-tight",
            iteration.current >= iteration.total
              ? "text-emerald-600 dark:text-emerald-500"
              : "text-foreground",
          )}
        >
          Loop {iteration.current} of {iteration.total}
        </p>
      )}
      {enabled && !iteration && (
        <p className="text-muted-foreground">No multi-loop habits in today&apos;s stack</p>
      )}
    </div>
  );
}
