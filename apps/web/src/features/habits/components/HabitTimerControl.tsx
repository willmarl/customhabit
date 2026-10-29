import { useEffect, useState, type ReactNode } from "react";
import { Timer, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconTooltipWrap } from "@/components/ui/icon-tooltip";
import {
  elapsedSince,
  formatSplitClock,
} from "../lib/formatTimer";
import {
  formatSplitDelta,
  previousDurationFor,
  ringAtSeconds,
  splitDeltaTone,
} from "../lib/focusTimer";
import { startTimedRing, stopBreakDoneRing } from "../lib/breakDoneSound";
import type { Habit } from "../types";

type HabitTimerControlProps = {
  habit: Habit;
  isTiming: boolean;
  /** Another habit currently has the timer (dims this row's control). */
  otherTiming: boolean;
  /** Today's habit is fully done — no starting a new timer. */
  habitDone?: boolean;
  startedAt?: string | null;
  previousDurations?: Record<string, number>;
  onStart: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  disabled?: boolean;
};

const RING_MS = 30_000;
const PLACEHOLDER = "--:--.--";

/** Shared fixed column width — keep HabitRow / header spacers in sync. */
export const HABIT_TIMER_COLUMN_CLASS = "w-[12.5rem]";

function DiamondFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex size-7 shrink-0 items-center justify-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-[3px] rotate-45 rounded-[3px] border border-current"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

function HexFrame({
  children,
  ticking,
  className,
}: {
  children: ReactNode;
  ticking?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex size-7 shrink-0 items-center justify-center",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 28 28"
        className={cn(
          "absolute inset-0 size-7 text-current",
          ticking && "habit-timer-hex-tick",
        )}
      >
        <polygon
          points="14,2 24.5,8 24.5,20 14,26 3.5,20 3.5,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative z-10">{children}</span>
    </span>
  );
}

export default function HabitTimerControl({
  habit,
  isTiming,
  otherTiming,
  habitDone = false,
  startedAt = null,
  previousDurations,
  onStart,
  onFinish,
  onDiscard,
  disabled = false,
}: HabitTimerControlProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [ringStartedAt, setRingStartedAt] = useState<number | null>(null);
  const [soundDismissed, setSoundDismissed] = useState(false);

  const previous = previousDurationFor(previousDurations, habit.id);
  const ringThreshold = ringAtSeconds(
    habit.duration_minutes,
    habit.buffer_minutes ?? 0,
  );

  useEffect(() => {
    if (!isTiming || !startedAt) {
      stopBreakDoneRing();
      return;
    }
    const tick = () => {
      const now = Date.now();
      setNowMs(now);
      const elapsed = elapsedSince(startedAt, now);
      if (elapsed >= ringThreshold) {
        setRingStartedAt((prev) => {
          if (prev != null) return prev;
          startTimedRing(RING_MS);
          return now;
        });
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(id);
      stopBreakDoneRing();
    };
  }, [isTiming, startedAt, ringThreshold]);

  const elapsed =
    isTiming && startedAt ? elapsedSince(startedAt, nowMs) : null;

  const ringingUi =
    isTiming &&
    !soundDismissed &&
    ringStartedAt != null &&
    nowMs - ringStartedAt < RING_MS;

  let timeLabel = PLACEHOLDER;
  let timeMuted = true;
  if (isTiming && elapsed != null) {
    timeLabel = formatSplitClock(elapsed);
    timeMuted = false;
  } else if (previous != null) {
    timeLabel = formatSplitClock(previous);
    timeMuted = true;
  }

  const deltaElapsed = isTiming && elapsed != null ? elapsed : null;
  const showDelta = previous != null && deltaElapsed != null;
  const delta = showDelta ? formatSplitDelta(deltaElapsed, previous) : null;
  const tone = showDelta ? splitDeltaTone(deltaElapsed, previous) : null;

  const startBlocked = habitDone && !isTiming;
  const tooltip = isTiming
    ? "Finish — stop timer & mark habit done"
    : startBlocked
      ? "Habit finished for today"
      : otherTiming
        ? "Start timer (stops the other habit)"
        : "Start focus timer";

  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-[1.75rem_3.75rem_4.25rem_1.25rem] items-center gap-x-1 pl-1",
        HABIT_TIMER_COLUMN_CLASS,
        (otherTiming || startBlocked) && !isTiming && "opacity-45",
      )}
    >
      <IconTooltipWrap tooltip={tooltip}>
        <button
          type="button"
          disabled={disabled || startBlocked}
          onClick={() => {
            if (isTiming) void onFinish();
            else onStart();
          }}
          className={cn(
            "flex size-7 items-center justify-center",
            "disabled:pointer-events-none disabled:opacity-50",
            isTiming
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/70 hover:text-muted-foreground",
            (otherTiming || startBlocked) &&
              !isTiming &&
              "text-muted-foreground/40",
          )}
          aria-label={
            isTiming
              ? `Finish ${habit.name} — stop timer and mark done`
              : startBlocked
                ? `${habit.name} finished for today`
                : `Start timer for ${habit.name}`
          }
        >
          {isTiming ? (
            <HexFrame ticking>
              <Timer className="size-3" strokeWidth={1.75} />
            </HexFrame>
          ) : (
            <DiamondFrame>
              <Timer className="size-3" strokeWidth={1.75} />
            </DiamondFrame>
          )}
        </button>
      </IconTooltipWrap>

      <span
        className={cn(
          "truncate text-xs font-medium tracking-tight tabular-nums",
          timeMuted ? "text-muted-foreground/70" : "text-foreground",
        )}
      >
        {timeLabel}
      </span>

      <span
        className={cn(
          "truncate text-xs font-semibold tabular-nums",
          tone === "ahead" && "text-emerald-600 dark:text-emerald-400",
          tone === "behind" && "text-red-600 dark:text-red-400",
          tone === "even" && "text-muted-foreground",
          delta == null && "invisible",
        )}
        title={delta != null ? "vs previous timed run" : undefined}
        aria-hidden={delta == null}
      >
        {delta ?? "+0:00.00"}
      </span>

      <div className="relative flex size-5 items-center justify-center justify-self-center">
        {isTiming ? (
          <IconTooltipWrap tooltip="Discard timer (don't mark habit)">
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "rounded p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-50",
                ringingUi && "invisible",
              )}
              aria-label={`Discard timer for ${habit.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onDiscard();
              }}
            >
              <X className="size-3.5" />
            </button>
          </IconTooltipWrap>
        ) : null}
        {ringingUi ? (
          <button
            type="button"
            className="absolute inset-0 m-auto flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground"
            title="Mute alarm"
            aria-label="Mute alarm"
            onClick={(e) => {
              e.stopPropagation();
              stopBreakDoneRing();
              setSoundDismissed(true);
            }}
          >
            <VolumeX className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
