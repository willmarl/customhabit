import { GripVertical, Pencil } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconTooltipButton, IconTooltipWrap } from "@/components/ui/icon-tooltip";
import { cn } from "@/lib/utils";
import { getHabitDate } from "@/lib/dates";
import type { Completion, Habit } from "../types";
import { getLinkedCellState } from "../lib/linkedHabits";
import {
  getCellProgress,
  getCompletion,
  isCompletionDone,
} from "../lib/completionUtils";
import { getSubCategoryColor } from "../lib/subCategoryColors";
import { formatDurationMinutes } from "../lib/dayEstimate";
import { formatGoldChance } from "@/features/casino/gold";
import {
  isRoundRobinHabit,
  resolveRoundRobinItem,
} from "../lib/roundRobin";
import TallyCell from "./TallyCell";
import HabitTimerControl, { HABIT_TIMER_COLUMN_CLASS } from "./HabitTimerControl";

type HabitRowProps = {
  habit: Habit;
  index: number;
  dates: string[];
  allHabits: Habit[];
  completions: Completion[];
  subGroupColors: Record<number, string>;
  subGroupNames: Record<number, string>;
  groupColorId?: string;
  dayStartTime?: string;
  onToggle: (habitId: number, date: string) => void;
  onRename: (habit: Habit) => void;
  onLinkedClick?: (subGroupId: number) => void;
  activeHabitId?: number | null;
  activeStartedAt?: string | null;
  previousDurations?: Record<string, number>;
  onStartTimer?: (habitId: number) => void;
  onFinishTimer?: () => void;
  onDiscardTimer?: () => void;
  timerBusy?: boolean;
};

export default function HabitRow({
  habit,
  index,
  dates,
  allHabits,
  completions,
  subGroupColors,
  subGroupNames,
  groupColorId,
  dayStartTime = "04:00",
  onToggle,
  onRename,
  onLinkedClick,
  activeHabitId = null,
  activeStartedAt = null,
  previousDurations,
  onStartTimer,
  onFinishTimer,
  onDiscardTimer,
  timerBusy = false,
}: HabitRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLinked = habit.linked_sub_group_id != null;
  const linkedSubGroupId = habit.linked_sub_group_id;
  const linkedSubName =
    linkedSubGroupId != null ? subGroupNames[linkedSubGroupId] : undefined;
  const linkedTooltip = linkedSubName
    ? `Linked to “${linkedSubName}” — complete habits in the sub-category`
    : "Linked sub-category habit — not checkable here";
  const linkedNameTooltip = linkedSubName
    ? `Linked to “${linkedSubName}” — click to jump there`
    : "Linked sub-category — click to jump there";
  const linkedColor = isLinked
    ? getSubCategoryColor(subGroupColors[linkedSubGroupId!])
    : undefined;
  const groupColor = groupColorId ? getSubCategoryColor(groupColorId) : undefined;
  const label = String(index + 1).padStart(2, "0");
  const isRoundRobin = isRoundRobinHabit(habit);
  const today = getHabitDate(new Date(), dayStartTime);
  const todayMember = isRoundRobin
    ? resolveRoundRobinItem(habit, today)
    : null;
  const isTiming = activeHabitId === habit.id;
  const otherTiming = activeHabitId != null && !isTiming;
  const habitDoneToday = isCompletionDone(
    getCompletion(completions, habit.id, today),
  );
  const showTimer = !isLinked && onStartTimer && onFinishTimer && onDiscardTimer;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 border-b border-border/70 py-1.5 last:border-b-0",
        isDragging && "relative z-10 bg-background opacity-90 shadow-sm",
        isTiming && "bg-muted/40",
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
          <IconTooltipWrap tooltip={linkedNameTooltip} side="left">
            <button
              type="button"
              onClick={() => onLinkedClick?.(linkedSubGroupId!)}
              className={cn(
                "cursor-help truncate text-sm font-medium hover:underline",
                linkedColor?.textLinked,
              )}
              style={linkedColor?.styles?.textLinked}
            >
              {habit.name}
            </button>
          </IconTooltipWrap>
        ) : (
          <>
            <span
              className={cn(
                "truncate text-sm",
                habit.once_per_day &&
                  "font-semibold text-sky-700 dark:text-sky-400",
              )}
            >
              {habit.name}
            </span>
            {isRoundRobin ? (
              <span
                className="shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"
                title="Cycles through member names each day"
              >
                round robin
              </span>
            ) : null}
            {isRoundRobin && todayMember ? (
              <span
                className="min-w-0 truncate text-xs text-muted-foreground"
                title={`Today: ${todayMember}`}
              >
                Today: {todayMember}
              </span>
            ) : null}
            {habit.once_per_day ? (
              <span
                className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-500/20 dark:text-sky-400"
                title="Once per day — fixed session"
              >
                once daily
              </span>
            ) : null}
            {habit.reward_enabled ? (
              <span
                className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                title={`${formatGoldChance(habit.duration_minutes)} chance of a gold token`}
              >
                token
              </span>
            ) : null}
            <span
              className={cn(
                "shrink-0 text-xs tabular-nums text-muted-foreground",
                habit.once_per_day && "font-medium text-sky-700/80 dark:text-sky-400/80",
              )}
              title={`${habit.duration_minutes} minutes`}
            >
              {formatDurationMinutes(habit.duration_minutes)}
            </span>
          </>
        )}
        <IconTooltipButton
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          tooltip="Edit habit"
          onClick={() => onRename(habit)}
          aria-label={`Edit ${habit.name}`}
        >
          <Pencil className="size-3" />
        </IconTooltipButton>
      </div>

      <div className="flex items-center gap-0.5">
        {dates.map((dateStr) => {
          const linkedState = getLinkedCellState(
            habit,
            allHabits,
            completions,
            dateStr,
          );

          if (linkedState.kind === "empty") {
            return (
              <TallyCell
                key={dateStr}
                checked={false}
                variant="empty"
                tooltip={isLinked ? linkedTooltip : undefined}
                tooltipSide={isLinked ? "left" : undefined}
              />
            );
          }

          if (linkedState.kind === "linked") {
            return (
              <TallyCell
                key={dateStr}
                progress={linkedState.progress}
                variant="linked"
                accentColor={linkedColor}
                accentTone="linked"
                tooltip={linkedTooltip}
                tooltipSide="left"
              />
            );
          }

          const member = isRoundRobin
            ? resolveRoundRobinItem(habit, dateStr)
            : null;

          return (
            <TallyCell
              key={dateStr}
              progress={getCellProgress(getCompletion(completions, habit.id, dateStr))}
              accentColor={groupColor}
              accentTone="full"
              tooltip={member ? `Round robin: ${member}` : undefined}
              tooltipSide={member ? "left" : undefined}
              onToggle={() => onToggle(habit.id, dateStr)}
            />
          );
        })}

        {showTimer ? (
          <HabitTimerControl
            key={isTiming && activeStartedAt ? `run-${activeStartedAt}` : `idle-${habit.id}`}
            habit={habit}
            isTiming={isTiming}
            otherTiming={otherTiming}
            habitDone={habitDoneToday}
            startedAt={isTiming ? activeStartedAt : null}
            previousDurations={previousDurations}
            disabled={timerBusy}
            onStart={() => onStartTimer(habit.id)}
            onFinish={onFinishTimer}
            onDiscard={onDiscardTimer}
          />
        ) : (
          // Keep row alignment when linked rows omit the timer column
          <div className={`${HABIT_TIMER_COLUMN_CLASS} shrink-0 pl-1`} aria-hidden />
        )}
      </div>
    </div>
  );
}
