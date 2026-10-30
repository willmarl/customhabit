import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVisibleDates, parseServerDateTime } from "@/lib/dates";
import { useRetiredHabits, useRestoreHabit } from "../hooks";
import { getCellProgress, getCompletion } from "../lib/completionUtils";
import { formatDurationMinutes } from "../lib/dayEstimate";
import DateGridHeader from "./DateGridHeader";
import TallyCell from "./TallyCell";

type RetiredHabitsPanelProps = {
  lookbackDays: number;
  dayStartTime: string;
};

function formatRetiredDate(iso: string): string {
  const d = parseServerDateTime(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RetiredHabitsPanel({
  lookbackDays,
  dayStartTime,
}: RetiredHabitsPanelProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useRetiredHabits();
  const { mutate: restoreHabit, isPending: isRestoring } = useRestoreHabit();

  const habits = data?.habits ?? [];
  const completions = data?.completions ?? [];
  const dates = getVisibleDates(lookbackDays, dayStartTime);

  if (isLoading || habits.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-border/80 bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
      >
        <span className="font-medium text-muted-foreground">
          Retired habits
          <span className="ml-2 tabular-nums text-foreground/80">({habits.length})</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-3">
          <p className="text-xs text-muted-foreground">
            Archived habits are hidden from your active board. History is read-only — restore
            to track them again.
          </p>

          <div className="overflow-x-auto">
            <div className="min-w-fit">
              <div className="flex items-end justify-end gap-0.5 pb-2 pl-[calc(1rem+1.5rem+1.5rem+0.375rem)]">
                <DateGridHeader dates={dates} />
              </div>

              <ul className="space-y-1">
                {habits.map((habit) => (
                  <li
                    key={habit.id}
                    className="flex items-center gap-2 border-b border-border/50 py-1.5 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-muted-foreground">
                        {habit.name}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {habit.group_name}
                        {" · "}
                        {formatDurationMinutes(habit.duration_minutes)}
                        {" · "}
                        retired {formatRetiredDate(habit.retired_at)}
                      </p>
                    </div>

                    <div className="flex gap-0.5">
                      {dates.map((dateStr) => (
                        <TallyCell
                          key={dateStr}
                          progress={getCellProgress(
                            getCompletion(completions, habit.id, dateStr),
                          )}
                        />
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isRestoring}
                      onClick={() => restoreHabit(habit.id)}
                      className="ml-1 h-7 shrink-0 text-xs"
                    >
                      Restore
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
