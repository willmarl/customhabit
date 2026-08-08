import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDurationMinutes } from "../lib/dayEstimate";
import { formatElapsedSeconds } from "../lib/formatTimer";
import {
  BREAK_OFFER_MS,
  type BreakUiState,
} from "../hooks/usePostHabitBreak";

type BreakOfferBarProps = {
  breakMinutes: number;
  state: BreakUiState;
  onAccept: () => void;
  onDecline: () => void;
  onEndEarly: () => void;
  onDismiss: () => void;
};

const breakPanelClass =
  "rounded-md border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-950/45";

function useLiveNow(active: boolean) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);
  return nowMs;
}

function DepletingBar({
  durationMs,
  tone = "muted",
}: {
  durationMs: number;
  tone?: "muted" | "accent";
}) {
  return (
    <div
      className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/80 dark:bg-amber-900/60"
      aria-hidden
    >
      <div
        className={cn(
          "h-full w-full origin-left rounded-full",
          tone === "accent"
            ? "bg-amber-500/80 dark:bg-amber-400/70"
            : "bg-amber-400/70 dark:bg-amber-500/50",
        )}
        style={{
          animation: `break-timer-deplete ${durationMs}ms linear forwards`,
        }}
      />
    </div>
  );
}

function OfferRow({
  breakMinutes,
  expiresAt,
  onAccept,
  onDecline,
}: {
  breakMinutes: number;
  expiresAt: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const nowMs = useLiveNow(true);
  const secondsLeft = Math.max(0, Math.ceil((expiresAt - nowMs) / 1000));

  return (
    <div className={breakPanelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-amber-900/70 dark:text-amber-100/70">
          <span className="font-medium text-amber-950 dark:text-amber-50">
            Take a {formatDurationMinutes(breakMinutes, "long")} break?
          </span>
          <span className="ml-2 tabular-nums text-xs text-amber-800/60 dark:text-amber-200/55">
            skips in {secondsLeft}s
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/40 dark:hover:bg-amber-900/50"
            onClick={onDecline}
          >
            Skip
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-amber-600 text-amber-50 hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
            onClick={onAccept}
          >
            Start
          </Button>
        </div>
      </div>
      <DepletingBar key={expiresAt} durationMs={BREAK_OFFER_MS} tone="muted" />
    </div>
  );
}

function RunningRow({
  breakMinutes,
  endsAt,
  onEndEarly,
}: {
  breakMinutes: number;
  endsAt: number;
  onEndEarly: () => void;
}) {
  const nowMs = useLiveNow(true);
  const remainingSec = Math.max(0, Math.ceil((endsAt - nowMs) / 1000));
  const totalMs = Math.max(1, breakMinutes * 60_000);

  return (
    <div className={breakPanelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-amber-900/70 dark:text-amber-100/70">
          <span className="font-medium text-amber-950 dark:text-amber-50">
            Break
          </span>
          {" · "}
          <span className="tabular-nums text-amber-950 dark:text-amber-50">
            {formatElapsedSeconds(remainingSec)}
          </span>
          {" left"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/40 dark:hover:bg-amber-900/50"
          onClick={onEndEarly}
        >
          End early
        </Button>
      </div>
      <DepletingBar key={endsAt} durationMs={totalMs} tone="accent" />
    </div>
  );
}

export default function BreakOfferBar({
  breakMinutes,
  state,
  onAccept,
  onDecline,
  onEndEarly,
  onDismiss,
}: BreakOfferBarProps) {
  if (state.kind === "idle") return null;

  if (state.kind === "offer") {
    return (
      <OfferRow
        key={state.expiresAt}
        breakMinutes={breakMinutes}
        expiresAt={state.expiresAt}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );
  }

  if (state.kind === "running") {
    return (
      <RunningRow
        key={state.endsAt}
        breakMinutes={breakMinutes}
        endsAt={state.endsAt}
        onEndEarly={onEndEarly}
      />
    );
  }

  return (
    <div className={breakPanelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Break done — back to it
        </p>
        <Button
          type="button"
          size="sm"
          className="h-8 bg-amber-600 text-amber-50 hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
          onClick={onDismiss}
        >
          Turn off
        </Button>
      </div>
    </div>
  );
}
