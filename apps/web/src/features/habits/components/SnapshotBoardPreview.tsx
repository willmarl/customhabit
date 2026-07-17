import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Habit, HabitGroup, SnapshotPayload } from "../types";
import { formatDurationMinutes } from "../lib/dayEstimate";
import { getSubCategoryColor } from "../lib/subCategoryColors";
import NotesMarkdownView from "./NotesMarkdownView";

type SnapshotBoardPreviewProps = {
  payload: SnapshotPayload;
};

function HabitLine({
  habit,
  index,
  linkedColor,
}: {
  habit: Habit;
  index: number;
  linkedColor?: ReturnType<typeof getSubCategoryColor>;
}) {
  const isLinked = habit.linked_sub_group_id != null;
  const retired = habit.retired_at != null;

  return (
    <li
      className={cn(
        "flex items-center gap-2 py-1 text-sm",
        retired && "opacity-70",
      )}
    >
      <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isLinked ? linkedColor?.textLinked : "text-foreground",
          habit.once_per_day && !isLinked && "font-semibold text-sky-700 dark:text-sky-400",
        )}
        style={isLinked ? linkedColor?.styles?.textLinked : undefined}
      >
        {habit.name}
      </span>
      {habit.habit_type === "round_robin" && !isLinked && (
        <span
          className="shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-400"
          title={(habit.round_robin_items ?? []).join(" → ")}
        >
          round robin
        </span>
      )}
      {habit.habit_type === "round_robin" &&
        !isLinked &&
        (habit.round_robin_items?.length ?? 0) > 0 && (
          <span
            className="min-w-0 max-w-[10rem] truncate text-xs text-muted-foreground"
            title={(habit.round_robin_items ?? []).join(" → ")}
          >
            {(habit.round_robin_items ?? []).join(" · ")}
          </span>
        )}
      {habit.once_per_day && !isLinked && (
        <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-500/20 dark:text-sky-400">
          once daily
        </span>
      )}
      {retired && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          retired
        </span>
      )}
      {!isLinked && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatDurationMinutes(habit.duration_minutes)}
        </span>
      )}
      {isLinked && (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          linked
        </span>
      )}
    </li>
  );
}

function GroupPreview({
  group,
  habits,
  subGroupColors,
  isCore = false,
}: {
  group: HabitGroup;
  habits: Habit[];
  subGroupColors: Record<number, string>;
  isCore?: boolean;
}) {
  const sectionColor = !isCore ? getSubCategoryColor(group.color) : null;
  const groupHabits = habits
    .filter((h) => h.group_id === group.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (groupHabits.length === 0 && !group.notes.trim()) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h3
        className={cn(
          "text-sm font-semibold tracking-tight",
          sectionColor?.text ?? "text-foreground",
        )}
        style={sectionColor?.styles?.text}
      >
        {group.name}
      </h3>
      {groupHabits.length > 0 && (
        <ul className="divide-y divide-border/50 rounded-md border border-border/60 px-3">
          {groupHabits.map((habit, i) => (
            <HabitLine
              key={habit.id}
              habit={habit}
              index={i}
              linkedColor={
                habit.linked_sub_group_id != null
                  ? getSubCategoryColor(subGroupColors[habit.linked_sub_group_id])
                  : undefined
              }
            />
          ))}
        </ul>
      )}
      {group.notes.trim() && (
        <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <NotesMarkdownView value={group.notes} />
        </div>
      )}
    </section>
  );
}

export default function SnapshotBoardPreview({ payload }: SnapshotBoardPreviewProps) {
  const subGroupColors = Object.fromEntries(
    payload.sub_groups.map((g) => [g.id, g.color]),
  );

  const activeHabits = payload.habits.filter((h) => h.retired_at == null);
  const retiredHabits = payload.habits.filter((h) => h.retired_at != null);

  return (
    <div className="space-y-6">
      <GroupPreview
        group={payload.core_group}
        habits={activeHabits}
        subGroupColors={subGroupColors}
        isCore
      />

      {payload.sub_groups.length > 0 && (
        <>
          <Separator />
          <div className="space-y-6">
            {payload.sub_groups
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((group) => (
                <GroupPreview
                  key={group.id}
                  group={group}
                  habits={activeHabits}
                  subGroupColors={subGroupColors}
                />
              ))}
          </div>
        </>
      )}

      {retiredHabits.length > 0 && (
        <>
          <Separator />
          <section className="space-y-2">
            <h3 className="text-sm font-semibold tracking-tight text-muted-foreground">
              Retired in snapshot
            </h3>
            <ul className="divide-y divide-border/50 rounded-md border border-border/60 px-3">
              {retiredHabits.map((habit, i) => (
                <HabitLine key={habit.id} habit={habit} index={i} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
