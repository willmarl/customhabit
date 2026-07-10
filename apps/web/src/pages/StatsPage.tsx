import { Link } from "react-router-dom";
import { useStatsSummary } from "@/features/habits/hooks";
import ContributionHeatmap from "@/features/habits/components/ContributionHeatmap";

function StatCard({
  label,
  hint,
  value,
}: {
  label: string;
  hint?: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-xs font-medium text-foreground/80">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading, isError } = useStatsSummary();

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">Loading stats…</p>
    );
  }

  if (isError || !stats) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Failed to load stats. Is the API running?
      </p>
    );
  }

  const rangeLabel = `${new Date(stats.from_date + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} – ${new Date(stats.to_date + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8 text-left">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Heatmap shows habits fully completed per day (loop-aware). {rangeLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Habits done"
          hint="Lifetime"
          value={stats.lifetime_habits_done.toLocaleString()}
        />
        <StatCard
          label="Current streak"
          hint="At least one habit per day"
          value={stats.current_streak}
        />
        <StatCard
          label="Longest streak"
          hint="At least one habit per day"
          value={stats.longest_streak}
        />
        <StatCard
          label="Longest true streak"
          hint="Full stack every day"
          value={stats.longest_true_streak}
        />
      </div>

      <section className="rounded-md border border-border bg-card p-4">
        <ContributionHeatmap
          days={stats.days}
          maxHabitsInDay={stats.max_habits_in_day}
        />
      </section>

      <p className="text-xs text-muted-foreground">
        <Link to="/" className="underline hover:text-foreground">
          Back to habits
        </Link>
      </p>
    </div>
  );
}
