import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";
import type { Board } from "../types";
import { useTapOut, useUpdateDayRun } from "../hooks";
import { getHabitDate } from "@/lib/dates";
import TapOutConfirmDialog from "./TapOutConfirmDialog";

type DayModeBarProps = {
  board: Board;
};

const MODES: { id: "normal" | "half"; label: string; hint: string; shortcut: string }[] = [
  {
    id: "normal",
    label: "Normal",
    hint: "One tap marks a habit done",
    shortcut: "1",
  },
  {
    id: "half",
    label: "½ Half",
    hint: "First tap half-fills; second tap completes",
    shortcut: "2",
  },
];

function shouldIgnoreModeShortcut(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  if (target.closest('[role="dialog"]')) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export default function DayModeBar({ board }: DayModeBarProps) {
  const today = getHabitDate(new Date(), board.settings.day_start_time);
  const { openModal } = useModal();
  const { mutate: updateDayRun, isPending: isUpdating } = useUpdateDayRun();
  const { isPending: isTappingOut } = useTapOut();

  const dayRun = board.day_run;
  const mode = dayRun?.mode ?? "normal";
  const tappedOut = dayRun?.status === "tap_out";

  const setMode = useCallback(
    (next: "normal" | "half") => {
      updateDayRun({ date: today, mode: next });
    },
    [today, updateDayRun],
  );

  useEffect(() => {
    if (tappedOut) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (shouldIgnoreModeShortcut(e.target)) return;

      const next =
        e.key === "1" ? "normal" : e.key === "2" ? "half" : null;
      if (!next || isUpdating) return;

      setMode(next);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tappedOut, isUpdating, setMode]);

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
            aria-pressed={mode === m.id}
            size="sm"
            disabled={isUpdating}
            title={`${m.hint} (press ${m.shortcut})`}
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
