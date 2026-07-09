import { useCallback, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { cn } from "@/lib/utils";
import { formatDateISO, getHabitDate } from "@/lib/dates";
import { useModal } from "@/components/providers/ModalProvider";
import { useBoard, useToggleCompletion } from "../hooks";
import type { ToggleCompletionRequest } from "../types";
import { allStackHabitsDone } from "../lib/completionUtils";
import HabitGroupSection from "./HabitGroupSection";
import CreateSubCategoryDialog from "./CreateSubCategoryDialog";
import DayEstimateBar from "./DayEstimateBar";
import DayModeBar from "./DayModeBar";
import LoopIterationBar from "./LoopIterationBar";
import RetiredHabitsPanel from "./RetiredHabitsPanel";
import { useLoopModeUi } from "../hooks/useLoopModeUi";

export default function HabitBoard() {
  const { data: board, isLoading, isError } = useBoard();
  const { mutate: toggleCompletion } = useToggleCompletion();
  const { enabled: loopViewEnabled, toggle: toggleLoopView } = useLoopModeUi();
  const { openModal, closeModal } = useModal();
  const confettiFired = useRef(false);
  const today = getHabitDate(new Date(), board?.settings.day_start_time);

  const handleToggle = useCallback(
    (data: ToggleCompletionRequest) => {
      toggleCompletion(data);
    },
    [toggleCompletion],
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
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8 text-left">
      <DayModeBar board={board} />
      <LoopIterationBar
        board={board}
        completions={completions}
        enabled={loopViewEnabled}
        onToggle={toggleLoopView}
      />
      <DayEstimateBar board={board} completions={completions} />

      <HabitGroupSection
        group={board.core_group}
        board={board}
        completions={completions}
        subGroupColors={subGroupColors}
        onToggle={handleToggle}
        isCore
        onLinkedClick={scrollToSub}
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
