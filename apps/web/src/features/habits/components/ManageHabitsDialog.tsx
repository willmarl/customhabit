import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import type { Habit } from "../types";
import { useDeleteHabit, useUpdateHabit } from "../hooks";

type ManageHabitsDialogProps = {
  groupId: number;
  habits: Habit[];
  onClose: () => void;
};

function ManageHabitRow({ habit }: { habit: Habit }) {
  const [name, setName] = useState(habit.name);
  const [duration, setDuration] = useState(String(habit.duration_minutes));
  const [oncePerDay, setOncePerDay] = useState(habit.once_per_day);
  const { mutate: updateHabit } = useUpdateHabit();
  const { mutate: deleteHabit } = useDeleteHabit();

  useEffect(() => {
    setName(habit.name);
    setDuration(String(habit.duration_minutes));
    setOncePerDay(habit.once_per_day);
  }, [habit.id, habit.name, habit.duration_minutes, habit.once_per_day]);

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(habit.name);
      return;
    }
    if (trimmed !== habit.name) {
      updateHabit({ id: habit.id, data: { name: trimmed } });
    }
  };

  const saveDuration = () => {
    const parsed = parseInt(duration, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setDuration(String(habit.duration_minutes));
      return;
    }
    if (parsed !== habit.duration_minutes) {
      updateHabit({ id: habit.id, data: { duration_minutes: parsed } });
    }
  };

  const handleOncePerDay = (checked: boolean) => {
    setOncePerDay(checked);
    if (checked !== habit.once_per_day) {
      updateHabit({ id: habit.id, data: { once_per_day: checked } });
    }
  };

  return (
    <li className="space-y-2 rounded-md border border-border/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="h-8 flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
          aria-label={`Rename ${habit.name}`}
        />
        <IconTooltipButton
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          tooltip={`Delete ${habit.name}`}
          onClick={() => deleteHabit(habit.id)}
          aria-label={`Delete ${habit.name}`}
        >
          <Trash2 className="size-3.5" />
        </IconTooltipButton>
      </div>
      <div className="flex flex-wrap items-center gap-4 pl-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={`duration-${habit.id}`} className="text-xs text-muted-foreground">
            Minutes
          </Label>
          <Input
            id={`duration-${habit.id}`}
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onBlur={saveDuration}
            className="h-7 w-16 text-xs tabular-nums"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={oncePerDay}
            onCheckedChange={(v) => handleOncePerDay(v === true)}
          />
          Once per day
        </label>
      </div>
    </li>
  );
}

export default function ManageHabitsDialog({
  groupId,
  habits,
  onClose,
}: ManageHabitsDialogProps) {
  const editable = habits
    .filter((h) => h.group_id === groupId && h.linked_sub_group_id == null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Rename, set duration, or remove habits. &quot;Once per day&quot; is for fixed
        sessions like exercise — only one completion per day even in loop mode.
      </p>
      <ul className="space-y-2">
        {editable.length === 0 && (
          <li className="text-sm text-muted-foreground">No habits to manage.</li>
        )}
        {editable.map((habit) => (
          <ManageHabitRow key={habit.id} habit={habit} />
        ))}
      </ul>

      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
