import { useMemo, useState } from "react";
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
import RenameHabitDialog from "./RenameHabitDialog";

type HabitTableProps = {
  groupId: number;
  groupColorId?: string;
  habits: Habit[];
  lookbackDays: number;
  completions: Completion[];
  subGroupColors: Record<number, string>;
  onToggle: (data: ToggleCompletionRequest) => void;
  onLinkedClick?: (subGroupId: number) => void;
};

export default function HabitTable({
  groupId,
  groupColorId,
  habits,
  lookbackDays,
  completions,
  subGroupColors,
  onToggle,
  onLinkedClick,
}: HabitTableProps) {
  const dates = getVisibleDates(lookbackDays);
  const { mutate: reorder } = useReorderHabits();
  const [renaming, setRenaming] = useState<Habit | null>(null);

  const sorted = [...habits]
    .filter((h) => h.group_id === groupId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const completionSet = useMemo(
    () => new Set(completions.map((c) => `${c.habit_id}:${c.date}`)),
    [completions],
  );

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
                    completionSet={completionSet}
                    subGroupColors={subGroupColors}
                    groupColorId={groupColorId}
                    onToggle={(habitId, date) =>
                      onToggle({ habit_id: habitId, date })
                    }
                    onRename={setRenaming}
                    onLinkedClick={onLinkedClick}
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
