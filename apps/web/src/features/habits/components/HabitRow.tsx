import { Pencil } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Completion, Habit } from "../types";
import { getLinkedCellState } from "../lib/linkedHabits";
import TallyCell from "./TallyCell";

type HabitRowProps = {
  habit: Habit;
  index: number;
  dates: string[];
  allHabits: Habit[];
  completions: Completion[];
  completionSet: Set<string>;
  onToggle: (habitId: number, date: string) => void;
  onRename: (habit: Habit) => void;
  onLinkedClick?: (subGroupId: number) => void;
};

export default function HabitRow({
  habit,
  index,
  dates,
  allHabits,
  completions,
  completionSet,
  onToggle,
  onRename,
  onLinkedClick,
}: HabitRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLinked = habit.linked_sub_group_id != null;
  const label = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 border-b border-border/50 py-1.5 last:border-b-0",
        isDragging && "relative z-10 bg-background opacity-90 shadow-sm",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
          {label}
        </span>
        {isLinked ? (
          <button
            type="button"
            onClick={() => onLinkedClick?.(habit.linked_sub_group_id!)}
            className="truncate text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
          >
            {habit.name}
          </button>
        ) : (
          <span className="truncate text-sm">{habit.name}</span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          onClick={() => onRename(habit)}
          aria-label={`Rename ${habit.name}`}
        >
          <Pencil className="size-3" />
        </Button>
      </div>

      <div className="flex gap-0.5">
        {dates.map((dateStr) => {
          const linkedState = getLinkedCellState(
            habit,
            allHabits,
            completions,
            dateStr,
          );

          if (linkedState.kind === "empty") {
            return <TallyCell key={dateStr} checked={false} variant="empty" />;
          }

          if (linkedState.kind === "linked") {
            return (
              <TallyCell
                key={dateStr}
                checked={linkedState.checked}
                variant="linked"
              />
            );
          }

          return (
            <TallyCell
              key={dateStr}
              checked={completionSet.has(`${habit.id}:${dateStr}`)}
              onToggle={() => onToggle(habit.id, dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}
