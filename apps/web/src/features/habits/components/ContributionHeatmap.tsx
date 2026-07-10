import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import "react-activity-calendar/tooltips.css";
import type { DayStat } from "../types";
import { blockSizeForWidth, weekColumnCount } from "../lib/heatmapLayout";

const BLOCK_MARGIN = 2;
const LABEL_GUTTER = 36;
const MIN_BLOCK = 9;

function levelFor(habitsDone: number, max: number): number {
  if (habitsDone <= 0) return 0;
  if (max <= 1) return 4;
  const ratio = habitsDone / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function formatTooltip(
  activity: Activity,
  stackComplete: boolean,
): string {
  const label = new Date(activity.date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (activity.count === 0) return `${label}: no habits done`;
  const habitLabel = `${activity.count} habit${activity.count === 1 ? "" : "s"} done`;
  return stackComplete ? `${label}: ${habitLabel} · stack complete` : `${label}: ${habitLabel}`;
}

function trimDaysToFitWidth(days: DayStat[], containerWidth: number): DayStat[] {
  if (containerWidth <= 0 || days.length === 0) return days;

  let trimmed = days;
  while (trimmed.length > 7) {
    const weeks = weekColumnCount(trimmed);
    const width = weeks * (MIN_BLOCK + BLOCK_MARGIN) + LABEL_GUTTER;
    if (width <= containerWidth) break;
    trimmed = trimmed.slice(7);
  }
  return trimmed;
}

type ContributionHeatmapProps = {
  days: DayStat[];
  maxHabitsInDay: number;
};

export default function ContributionHeatmap({
  days,
  maxHabitsInDay,
}: ContributionHeatmapProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const max = Math.max(maxHabitsInDay, 1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setContainerWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const displayDays = useMemo(
    () => trimDaysToFitWidth(days, containerWidth),
    [days, containerWidth],
  );

  const weekCount = useMemo(() => weekColumnCount(displayDays), [displayDays]);
  const blockSize = blockSizeForWidth(containerWidth, weekCount, BLOCK_MARGIN);

  const stackByDate = useMemo(
    () => new Map(displayDays.map((d) => [d.date, d.stack_complete])),
    [displayDays],
  );

  const data = useMemo<Activity[]>(
    () =>
      displayDays.map((day) => ({
        date: day.date,
        count: day.habits_done,
        level: levelFor(day.habits_done, max),
      })),
    [displayDays, max],
  );

  const trimmed = displayDays.length < days.length;

  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity in this period.</p>
    );
  }

  return (
    <div className="space-y-2">
      {trimmed && (
        <p className="text-xs text-muted-foreground">
          Showing recent weeks to fit your screen. Widen the window to see the full year.
        </p>
      )}
      <div ref={containerRef} className="w-full min-w-0">
        <ActivityCalendar
          data={data}
          colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
          blockSize={blockSize}
          blockRadius={2}
          blockMargin={BLOCK_MARGIN}
          fontSize={11}
          showWeekdayLabels={["mon", "wed", "fri"]}
          showTotalCount={false}
          labels={{
            legend: { less: "Less", more: "More" },
          }}
          theme={{
            light: ["hsl(0 0% 92%)", "hsl(152 69% 31%)"],
            dark: ["hsl(0 0% 22%)", "hsl(152 55% 45%)"],
          }}
          tooltips={{
            activity: {
              text: (activity) =>
                formatTooltip(activity, stackByDate.get(activity.date) ?? false),
            },
          }}
        />
      </div>
    </div>
  );
}
