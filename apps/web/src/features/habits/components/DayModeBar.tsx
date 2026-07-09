import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";
import type { Board, DayRun } from "../types";
import { useTapOut, useUpdateDayRun } from "../hooks";
import { getHabitDate } from "@/lib/dates";
import TapOutConfirmDialog from "./TapOutConfirmDialog";

type DayModeBarProps = {
  board: Board;
};

const MODES: { id: DayRun["mode"]; label: string; hint: string }[] = [
  { id: "normal", label: "Normal", hint: "1 pass per habit" },
  { id: "loop_30", label: "30m×2", hint: "Two 30-minute loops" },
  { id: "in_zone", label: "In zone", hint: "Full hour in one pass skips loop 2" },
];

export default function DayModeBar({ board }: DayModeBarProps) {
  const today = getHabitDate(new Date(), board.settings.day_start_time);
  const { openModal } = useModal();
  const { mutate: updateDayRun, isPending: isUpdating } = useUpdateDayRun();
  const { isPending: isTappingOut } = useTapOut();

  const dayRun = board.day_run;
  const mode = dayRun?.mode ?? "normal";
  const tappedOut = dayRun?.status === "tap_out";

  const setMode = (next: DayRun["mode"]) => {
    updateDayRun({ date: today, mode: next, loop_count: next === "loop_30" ? 2 : dayRun?.loop_count ?? 2 });
  };

  const handleTapOutClick = () => {
    openModal({
      title: "Tap out for today?",
      content: <TapOutConfirmDialog date={today} />,
    });
  };

  const handleUndoTapOut = () => {
    updateDayRun({ date: today, status: "active" });
  };

  if (tappedOut) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/80 bg-muted/40 px-4 py-3 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">You tapped out for today.</p>
          <p className="text-xs text-muted-foreground/80">
            Finish-time estimates are off. Completions you already logged are kept.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={handleUndoTapOut}
          className="h-8 shrink-0"
        >
          Undo tap out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">Mode</span>
      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <Button
            key={m.id}
            type="button"
            variant={mode === m.id ? "default" : "outline"}
            size="sm"
            disabled={isUpdating}
            title={m.hint}
            onClick={() => setMode(m.id)}
            className={cn("h-8")}
          >
            {m.label}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isTappingOut}
        onClick={handleTapOutClick}
        className="ml-auto h-8 text-muted-foreground hover:text-destructive"
      >
        IDC
      </Button>
    </div>
  );
}
