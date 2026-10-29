import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getVisibleDates } from "@/lib/dates";
import type { Completion, Habit, ToggleCompletionRequest } from "../types";
import { useReorderHabits } from "../hooks";
import AddHabitInline from "./AddHabitInline";
import DateGridHeader from "./DateGridHeader";
import HabitRow from "./HabitRow";
import { HABIT_TIMER_COLUMN_CLASS } from "./HabitTimerControl";
import RenameHabitDialog from "./RenameHabitDialog";

type HabitTableProps = {
  groupId: number;
  groupColorId?: string;
  habits: Habit[];
  lookbackDays: number;
  dayStartTime: string;
  completions: Completion[];
  subGroupColors: Record<number, string>;
  subGroupNames: Record<number, string>;
  onToggle: (data: ToggleCompletionRequest) => void;
  onLinkedClick?: (subGroupId: number) => void;
  activeHabitId?: number | null;
  activeStartedAt?: string | null;
  previousDurations?: Record<string, number>;
  onStartTimer?: (habitId: number) => void;
  onFinishTimer?: () => void;
  onDiscardTimer?: () => void;
  timerBusy?: boolean;
};

export default function HabitTable({
  groupId,
  groupColorId,
  habits,
  lookbackDays,
  dayStartTime,
  completions,
  subGroupColors,
  subGroupNames,
  onToggle,
  onLinkedClick,
  activeHabitId = null,
  activeStartedAt = null,
  previousDurations,
  onStartTimer,
  onFinishTimer,
  onDiscardTimer,
  timerBusy = false,
}: HabitTableProps) {
  const dates = getVisibleDates(lookbackDays, dayStartTime);
  const { mutate: reorder } = useReorderHabits();
  const [renaming, setRenaming] = useState<Habit | null>(null);

  const sorted = [...habits]
    .filter((h) => h.group_id === groupId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((h) => h.id === active.id);
    const newIndex = sorted.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorder(reordered.map((h, i) => ({ id: h.id, sort_order: i })));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          <div className="flex items-end justify-end gap-0.5 pb-2 pl-[calc(1rem+1.5rem+1.5rem+0.375rem)]">
            <DateGridHeader dates={dates} />
            {/* Spacer matches HabitTimerControl column width */}
            <div className={`${HABIT_TIMER_COLUMN_CLASS} shrink-0 pl-1`} aria-hidden />
          </div>

          {sorted.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sorted.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                {sorted.map((habit, index) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    index={index}
                    dates={dates}
                    allHabits={habits}
                    completions={completions}
                    subGroupColors={subGroupColors}
                    subGroupNames={subGroupNames}
                    groupColorId={groupColorId}
                    dayStartTime={dayStartTime}
                    onToggle={(habitId, date) =>
                      onToggle({ habit_id: habitId, date })
                    }
                    onRename={setRenaming}
                    onLinkedClick={onLinkedClick}
                    activeHabitId={activeHabitId}
                    activeStartedAt={activeStartedAt}
                    previousDurations={previousDurations}
                    onStartTimer={onStartTimer}
                    onFinishTimer={onFinishTimer}
                    onDiscardTimer={onDiscardTimer}
                    timerBusy={timerBusy}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <AddHabitInline groupId={groupId} dateColumnCount={dates.length} />
        </div>
      </div>

      {renaming && (
        <RenameHabitDialog
          habit={renaming}
          open={!!renaming}
          onOpenChange={(open) => !open && setRenaming(null)}
        />
      )}
    </>
  );
}
