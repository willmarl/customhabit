import { useCallback, useMemo, useOptimistic } from "react";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { cn } from "@/lib/utils";
import { useModal } from "@/components/providers/ModalProvider";
import { useBoard, useToggleCompletion } from "../hooks";
import type { Completion, ToggleCompletionRequest } from "../types";
import HabitGroupSection from "./HabitGroupSection";
import CreateSubCategoryDialog from "./CreateSubCategoryDialog";
import DayEstimateBar from "./DayEstimateBar";

function toggleCompletionReducer(
  state: Completion[],
  action: ToggleCompletionRequest,
): Completion[] {
  const exists = state.some(
    (c) => c.habit_id === action.habit_id && c.date === action.date,
  );
  if (exists) {
    return state.filter(
      (c) => !(c.habit_id === action.habit_id && c.date === action.date),
    );
  }
  return [...state, { habit_id: action.habit_id, date: action.date }];
}

export default function HabitBoard() {
  const { data: board, isLoading, isError } = useBoard();
  const { mutate: toggleCompletion } = useToggleCompletion();
  const { openModal, closeModal } = useModal();

  const [optimisticCompletions, addOptimisticCompletion] = useOptimistic(
    board?.completions ?? [],
    toggleCompletionReducer,
  );

  const handleToggle = useCallback(
    (data: ToggleCompletionRequest) => {
      addOptimisticCompletion(data);
      toggleCompletion(data);
    },
    [addOptimisticCompletion, toggleCompletion],
  );

  const subGroupColors = useMemo(
    () => Object.fromEntries(board?.sub_groups.map((g) => [g.id, g.color]) ?? []),
    [board?.sub_groups],
  );

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
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 text-left">
      <DayEstimateBar board={board} />

      <HabitGroupSection
        group={board.core_group}
        board={board}
        completions={optimisticCompletions}
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
                  completions={optimisticCompletions}
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
    </div>
  );
}
