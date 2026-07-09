import { GripVertical, Pencil } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconTooltipButton, IconTooltipWrap } from "@/components/ui/icon-tooltip";
import { cn } from "@/lib/utils";
import type { Completion, Habit } from "../types";
import { getLinkedCellState } from "../lib/linkedHabits";
import { getSubCategoryColor } from "../lib/subCategoryColors";
import TallyCell from "./TallyCell";

type HabitRowProps = {
  habit: Habit;
  index: number;
  dates: string[];
  allHabits: Habit[];
  completions: Completion[];
  completionSet: Set<string>;
  subGroupColors: Record<number, string>;
  groupColorId?: string;
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
  subGroupColors,
  groupColorId,
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
  const linkedColor = isLinked
    ? getSubCategoryColor(subGroupColors[habit.linked_sub_group_id!])
    : undefined;
  const groupColor = groupColorId ? getSubCategoryColor(groupColorId) : undefined;
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
      <IconTooltipWrap tooltip="Drag to reorder">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </IconTooltipWrap>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
          {label}
        </span>
        {isLinked ? (
          <IconTooltipWrap tooltip="Go to sub-category">
            <button
              type="button"
              onClick={() => onLinkedClick?.(habit.linked_sub_group_id!)}
              className={cn(
                "truncate text-sm font-medium hover:underline",
                linkedColor?.textLinked,
              )}
              style={linkedColor?.styles?.textLinked}
            >
              {habit.name}
            </button>
          </IconTooltipWrap>
        ) : (
          <span className="truncate text-sm">{habit.name}</span>
        )}
        <IconTooltipButton
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          tooltip="Rename habit"
          onClick={() => onRename(habit)}
          aria-label={`Rename ${habit.name}`}
        >
          <Pencil className="size-3" />
        </IconTooltipButton>
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
                accentColor={linkedColor}
                accentTone="linked"
              />
            );
          }

          return (
            <TallyCell
              key={dateStr}
              checked={completionSet.has(`${habit.id}:${dateStr}`)}
              accentColor={groupColor}
              accentTone="full"
              onToggle={() => onToggle(habit.id, dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}
