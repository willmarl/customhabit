import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings, useUpdateSettings } from "@/features/settings/hooks";
import type { AppSettings } from "@/features/habits/types";

type FormState = AppSettings;

const defaults: FormState = {
  lookback_days: 7,
  break_minutes: 5,
  wake_time: "07:00",
  bed_time: "23:00",
  day_start_time: "04:00",
  default_habit_minutes: 60,
  playlist_minutes: 53,
  loop_exempt_below_minutes: 60,
};

export default function SettingsPage() {
  const { data: settings, isLoading, isError } = useSettings();
  const { mutate: saveSettings, isPending, isSuccess } = useUpdateSettings();
  const [form, setForm] = useState<FormState>(defaults);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
  };

  const setNumber = (key: keyof FormState, value: string) => {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      setForm((prev) => ({ ...prev, [key]: parsed }));
    }
  };

  if (isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">Loading settings…</p>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-sm text-destructive">
        Failed to load settings. Is the API running?
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 text-left">
      <h2 className="mb-1 text-base font-semibold tracking-tight">Settings</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Schedule and timing defaults for day estimates.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Schedule</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wake_time">Wake time</Label>
              <Input
                id="wake_time"
                type="time"
                value={form.wake_time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, wake_time: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bed_time">Bed time</Label>
              <Input
                id="bed_time"
                type="time"
                value={form.bed_time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bed_time: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="day_start_time">Next day starts at</Label>
              <Input
                id="day_start_time"
                type="time"
                value={form.day_start_time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, day_start_time: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Like Anki: before this time, tallies and day progress still count as
                yesterday. Set to when your day actually ends (e.g. 1:00 AM if you
                go to bed after midnight).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Habit timing</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_habit_minutes">Default habit length (minutes)</Label>
              <Input
                id="default_habit_minutes"
                type="number"
                min={1}
                value={form.default_habit_minutes}
                onChange={(e) => setNumber("default_habit_minutes", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break_minutes">Break between habits (minutes)</Label>
              <Input
                id="break_minutes"
                type="number"
                min={0}
                value={form.break_minutes}
                onChange={(e) => setNumber("break_minutes", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playlist_minutes">Playlist length (minutes)</Label>
              <Input
                id="playlist_minutes"
                type="number"
                min={1}
                step={1}
                value={form.playlist_minutes}
                onChange={(e) => setNumber("playlist_minutes", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Soft timer anchor for ~1 hour blocks (53 minute playlist + wrap-up).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lookback_days">Tally lookback (days)</Label>
              <Input
                id="lookback_days"
                type="number"
                min={1}
                value={form.lookback_days}
                onChange={(e) => setNumber("lookback_days", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-md border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Loop mode</h3>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="loop_exempt_below_minutes">
              Exempt from double-loop below (minutes)
            </Label>
            <Input
              id="loop_exempt_below_minutes"
              type="number"
              min={0}
              value={form.loop_exempt_below_minutes}
              onChange={(e) =>
                setNumber("loop_exempt_below_minutes", e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              On loop days, habits shorter than this run once instead of looping.
              For example, at 40 any habit under 40 minutes is done in a single
              pass.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save settings"}
          </Button>
          {isSuccess && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
        </div>
      </form>

      <section className="mt-8 space-y-3 rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-medium">Data export</h3>
        <p className="text-sm text-muted-foreground">
          Download session history as JSONL for external analysis (one JSON object
          per line: habit name, duration, time-of-day, stack position, day mode,
          tap-out flag, and more).
        </p>
        <Button variant="outline" asChild>
          <a href="/api/habits/export/sessions?format=jsonl" download>
            Download sessions (JSONL)
          </a>
        </Button>
      </section>
    </div>
  );
}
