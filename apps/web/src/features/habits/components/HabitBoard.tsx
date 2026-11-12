import { useCallback, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { cn } from "@/lib/utils";
import { getHabitDate } from "@/lib/dates";
import { useModal } from "@/components/providers/ModalProvider";
import {
  useBoard,
  useDayActivity,
  useStartSession,
  useStopSession,
  useToggleCompletion,
} from "../hooks";
import { usePostHabitBreak } from "../hooks/usePostHabitBreak";
import type { ToggleCompletionRequest } from "../types";
import {
  allStackHabitsDone,
  getCompletion,
  isCompletionDone,
} from "../lib/completionUtils";
import { stopBreakDoneRing, unlockBreakAudio } from "../lib/breakDoneSound";
import HabitGroupSection from "./HabitGroupSection";
import CreateSubCategoryDialog from "./CreateSubCategoryDialog";
import DayEstimateBar from "./DayEstimateBar";
import DayModeBar from "./DayModeBar";
import BreakOfferBar from "./BreakOfferBar";
import RetiredHabitsPanel from "./RetiredHabitsPanel";

export default function HabitBoard() {
  const { data: board, isLoading, isError } = useBoard();
  const { data: activity } = useDayActivity();
  const { mutate: toggleCompletion, mutateAsync: toggleCompletionAsync } =
    useToggleCompletion();
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const {
    mutate: stopSession,
    mutateAsync: stopSessionAsync,
    isPending: isStopping,
  } = useStopSession();
  const { openModal, closeModal } = useModal();
  const confettiFired = useRef(false);
  const today = getHabitDate(new Date(), board?.settings.day_start_time);
  const breakMinutes = board?.settings.break_minutes ?? 0;
  const {
    state: breakState,
    offer: offerBreak,
    accept: acceptBreak,
    decline: declineBreak,
    endEarly: endBreakEarly,
    dismiss: dismissBreak,
  } = usePostHabitBreak(breakMinutes);

  const activeSession = activity?.active_session ?? null;
  const activeHabitId = activeSession?.habit_id ?? null;
  const timerBusy = isStarting || isStopping;

  const handleStartTimer = useCallback(
    (habitId: number) => {
      if (!board) return;
      if (isCompletionDone(getCompletion(board.completions, habitId, today))) {
        return;
      }
      unlockBreakAudio();
      startSession({ habit_id: habitId, source: "timer" });
    },
    [board, today, startSession],
  );

  /** Gave up — stop timer without marking the habit. */
  const handleDiscardTimer = useCallback(() => {
    if (!activeSession) return;
    stopBreakDoneRing();
    stopSession({ session_id: activeSession.id });
  }, [activeSession, stopSession]);

  /** Finished — stop timer and tick today's habit to done. */
  const handleFinishTimer = useCallback(async () => {
    if (!activeSession || !board) return;
    const habitId = activeSession.habit_id;
    const sessionId = activeSession.id;
    stopBreakDoneRing();

    try {
      await stopSessionAsync({ session_id: sessionId });
    } catch {
      return;
    }

    if (isCompletionDone(getCompletion(board.completions, habitId, today))) {
      return;
    }

    let becameDone = false;
    for (let i = 0; i < 5; i++) {
      try {
        const result = await toggleCompletionAsync({
          habit_id: habitId,
          date: today,
        });
        if (isCompletionDone(result ?? undefined)) {
          becameDone = true;
          break;
        }
        // Still partial (e.g. half mode) — keep ticking until done
      } catch {
        break;
      }
    }

    if (
      becameDone &&
      board.settings.break_minutes > 0 &&
      board.day_run?.status !== "tap_out"
    ) {
      offerBreak();
    }
  }, [
    activeSession,
    board,
    today,
    stopSessionAsync,
    toggleCompletionAsync,
    offerBreak,
  ]);

  const handleToggle = useCallback(
    (data: ToggleCompletionRequest) => {
      if (!board) {
        toggleCompletion(data);
        return;
      }
      const before = getCompletion(board.completions, data.habit_id, data.date);
      const wasDone = isCompletionDone(before);
      const sessionToStop =
        activeSession &&
        activeSession.habit_id === data.habit_id &&
        data.date === today
          ? activeSession
          : null;
      // Silence immediately on click — don't wait for the toggle round-trip
      // (scheduled Web Audio bursts would otherwise keep playing).
      if (sessionToStop) {
        stopBreakDoneRing();
      }
      toggleCompletion(data, {
        onSuccess: (result) => {
          if (
            result &&
            isCompletionDone(result) &&
            !wasDone &&
            sessionToStop
          ) {
            stopBreakDoneRing();
            stopSession({ session_id: sessionToStop.id });
          }
          if (
            result &&
            isCompletionDone(result) &&
            !wasDone &&
            data.date === today &&
            board.settings.break_minutes > 0 &&
            board.day_run?.status !== "tap_out"
          ) {
            offerBreak();
          }
        },
      });
    },
    [board, today, toggleCompletion, offerBreak, activeSession, stopSession],
  );

  const completions = board?.completions ?? [];

  const subGroupColors = useMemo(
    () => Object.fromEntries(board?.sub_groups.map((g) => [g.id, g.color]) ?? []),
    [board?.sub_groups],
  );

  const allDone = useMemo(
    () => (board ? allStackHabitsDone(board, completions, today) : false),
    [board, completions, today],
  );

  useEffect(() => {
    if (!board || board.day_run?.status === "tap_out") return;
    if (allDone && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
    }
    if (!allDone) {
      confettiFired.current = false;
    }
  }, [allDone, board]);

  const scrollToSub = (subGroupId: number) => {
    document.getElementById(`sub-${subGroupId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleAddSub = () => {
    openModal({
      title: "New sub-category",
      content: <CreateSubCategoryDialog onClose={closeModal} />,
    });
  };

  const addSubCategoryHeaderButton = (
    <IconTooltipButton
      variant="outline"
      size="sm"
      tooltip="Add sub-category"
      onClick={handleAddSub}
    >
      <Plus className="size-3.5" />
      Add sub-category
    </IconTooltipButton>
  );

  const addSubCategoryFooterButton = (
    <IconTooltipButton
      variant="outline"
      size="default"
      tooltip="Add another sub-category"
      onClick={handleAddSub}
      className={cn(
        "h-10 gap-2 border-dashed px-6 shadow-sm",
        "hover:border-foreground/35 hover:bg-muted/80 hover:shadow",
      )}
    >
      <Plus className="size-4" />
      Add sub-category
    </IconTooltipButton>
  );

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading habits…
      </p>
    );
  }

  if (isError || !board) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Failed to load habits. Is the API running?
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 text-left">
      <DayModeBar board={board} />
      <DayEstimateBar board={board} completions={completions} />
      <BreakOfferBar
        breakMinutes={breakMinutes}
        state={breakState}
        onAccept={acceptBreak}
        onDecline={declineBreak}
        onEndEarly={endBreakEarly}
        onDismiss={dismissBreak}
      />

      <HabitGroupSection
        group={board.core_group}
        board={board}
        completions={completions}
        subGroupColors={subGroupColors}
        onToggle={handleToggle}
        isCore
        onLinkedClick={scrollToSub}
        sessions={activity?.sessions}
        activeHabitId={activeHabitId}
        activeStartedAt={activeSession?.started_at ?? null}
        previousDurations={activity?.previous_durations}
        onStartTimer={handleStartTimer}
        onFinishTimer={handleFinishTimer}
        onDiscardTimer={handleDiscardTimer}
        timerBusy={timerBusy}
      />

      <Separator />

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Sub-categories
          </h2>
          {addSubCategoryHeaderButton}
        </div>

        {board.sub_groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sub-categories yet. Add one to track grouped habits.
          </p>
        ) : (
          <>
            {board.sub_groups.map((group, i) => (
              <div key={group.id}>
                {i > 0 && <Separator className="mb-8" />}
                <HabitGroupSection
                  group={group}
                  board={board}
                  completions={completions}
                  subGroupColors={subGroupColors}
                  onToggle={handleToggle}
                  sessions={activity?.sessions}
                  activeHabitId={activeHabitId}
                  activeStartedAt={activeSession?.started_at ?? null}
                  previousDurations={activity?.previous_durations}
                  onStartTimer={handleStartTimer}
                  onFinishTimer={handleFinishTimer}
                  onDiscardTimer={handleDiscardTimer}
                  timerBusy={timerBusy}
                />
              </div>
            ))}
            <div className="flex justify-center pt-6">
              {addSubCategoryFooterButton}
            </div>
          </>
        )}
      </div>

      <RetiredHabitsPanel
        lookbackDays={board.settings.lookback_days}
        dayStartTime={board.settings.day_start_time}
      />
    </div>
  );
}
