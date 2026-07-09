import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Board } from "../types";
import {
  computeDayEstimate,
  formatDurationMinutes,
  formatFinishTime,
} from "../lib/dayEstimate";

type DayEstimateBarProps = {
  board: Board;
};

export default function DayEstimateBar({ board }: DayEstimateBarProps) {
  const estimate = useMemo(() => computeDayEstimate(board), [board]);

  if (estimate.habitCount === 0) return null;

  const etaColorClass = {
    none: "text-muted-foreground",
    mild: "text-amber-600 dark:text-amber-500",
    moderate: "text-orange-600 dark:text-orange-500",
    severe: "text-red-600 dark:text-red-500",
  }[estimate.overtimeSeverity];

  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatDurationMinutes(estimate.totalMinutes, "long")}
          </span>
          {" · "}
          {estimate.habitCount} habit{estimate.habitCount === 1 ? "" : "s"}
          {board.settings.break_minutes > 0 && (
            <>
              {" · "}
              {formatDurationMinutes(board.settings.break_minutes, "long")} breaks
            </>
          )}
        </p>
        <p className={cn("tabular-nums", etaColorClass)}>
          Finish ~{formatFinishTime(estimate.finishAt)}
          {estimate.minutesPastBed > 0 && (
            <span className="ml-1.5">
              ({formatDurationMinutes(estimate.minutesPastBed, "long")} past bed)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
