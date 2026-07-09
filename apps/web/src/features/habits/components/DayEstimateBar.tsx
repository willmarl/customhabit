import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { compareFinishToBed, getHabitDate } from "@/lib/dates";
import type { Board, Completion } from "../types";
import {
  computeDayEstimate,
  formatDurationMinutes,
  formatFinishTime,
} from "../lib/dayEstimate";
import { allStackHabitsDone, estimateRemainingMinutes } from "../lib/completionUtils";

type DayEstimateBarProps = {
  board: Board;
  completions: Completion[];
};

export default function DayEstimateBar({ board, completions }: DayEstimateBarProps) {
  const today = getHabitDate(new Date(), board.settings.day_start_time);
  const [, tick] = useState(0);
  const tappedOut = board.day_run?.status === "tap_out";
  const hasAnchor = !!board.day_run?.started_at;

  useEffect(() => {
    if (tappedOut || !hasAnchor) return;
    const id = setInterval(() => tick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [tappedOut, hasAnchor]);

  const estimate = useMemo(() => {
    const now = new Date();
    const base = computeDayEstimate(board, now);
    if (tappedOut) {
      return {
        ...base,
        totalMinutes: 0,
        minutesPastBed: 0,
        minutesBeforeBed: 0,
        overtimeSeverity: "none" as const,
      };
    }

    const remaining = estimateRemainingMinutes(board, completions, today);
    const finishAt = hasAnchor
      ? new Date(now.getTime() + remaining * 60_000)
      : base.finishAt;

    const bedCompare = compareFinishToBed(
      finishAt,
      board.settings.bed_time,
      board.settings.wake_time,
      now,
    );

    return {
      ...base,
      totalMinutes: hasAnchor ? remaining : base.totalMinutes,
      finishAt,
      minutesPastBed: bedCompare.minutesPastBed,
      minutesBeforeBed: bedCompare.minutesBeforeBed,
      overtimeSeverity: bedCompare.overtimeSeverity,
    };
  }, [board, completions, today, tappedOut, hasAnchor, tick]);

  const allDone = useMemo(
    () => allStackHabitsDone(board, completions, today),
    [board, completions, today],
  );

  if (estimate.habitCount === 0) return null;

  const showOvertime = estimate.minutesPastBed > 0;

  const finishColorClass = allDone
    ? "text-emerald-600 dark:text-emerald-500"
    : {
        none: "text-muted-foreground",
        mild: "text-amber-600 dark:text-amber-500",
        moderate: "text-orange-600 dark:text-orange-500",
        severe: "text-red-600 dark:text-red-500",
      }[estimate.overtimeSeverity];

  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-muted-foreground">
          {tappedOut ? (
            <span className="font-medium text-muted-foreground">Estimate paused</span>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {formatDurationMinutes(estimate.totalMinutes, "long")}
              </span>
              {hasAnchor ? " left" : " total"}
              {" · "}
              {estimate.habitCount} habit{estimate.habitCount === 1 ? "" : "s"}
              {board.settings.break_minutes > 0 && (
                <>
                  {" · "}
                  {formatDurationMinutes(board.settings.break_minutes, "long")} breaks
                </>
              )}
            </>
          )}
        </p>
        {!tappedOut && (
          <p className={cn("tabular-nums", finishColorClass)}>
            {allDone ? "Finished" : "Finish"} ~{formatFinishTime(estimate.finishAt)}
            {showOvertime && (
              <span className="ml-1.5">
                ({formatDurationMinutes(estimate.minutesPastBed, "long")} past bed)
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
