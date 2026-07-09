import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateHabit } from "../hooks";
import type { Habit, UpdateHabitRequest } from "../types";

type RenameHabitDialogProps = {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RenameHabitDialog({
  habit,
  open,
  onOpenChange,
}: RenameHabitDialogProps) {
  const [name, setName] = useState(habit.name);
  const [duration, setDuration] = useState(String(habit.duration_minutes));
  const [oncePerDay, setOncePerDay] = useState(habit.once_per_day);
  const { mutate: updateHabit, isPending } = useUpdateHabit();

  useEffect(() => {
    setName(habit.name);
    setDuration(String(habit.duration_minutes));
    setOncePerDay(habit.once_per_day);
  }, [habit.id, habit.name, habit.duration_minutes, habit.once_per_day]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const parsedDuration = parseInt(duration, 10);
    if (Number.isNaN(parsedDuration) || parsedDuration < 1) return;

    const data: UpdateHabitRequest = {};
    if (trimmed !== habit.name) data.name = trimmed;
    if (parsedDuration !== habit.duration_minutes) {
      data.duration_minutes = parsedDuration;
    }
    if (oncePerDay !== habit.once_per_day) data.once_per_day = oncePerDay;

    if (Object.keys(data).length === 0) {
      onOpenChange(false);
      return;
    }

    updateHabit({ id: habit.id, data }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription className="sr-only">
              Change habit name, duration, or once-per-day setting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-duration">Duration (minutes)</Label>
              <Input
                id="habit-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={oncePerDay}
                onCheckedChange={(v) => setOncePerDay(v === true)}
              />
              <span>
                Once per day
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Fixed session — e.g. exercise, only one completion per day
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
