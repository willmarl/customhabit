import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { mutate: updateHabit } = useUpdateHabit();
  const { mutate: deleteHabit } = useDeleteHabit();

  useEffect(() => {
    setName(habit.name);
  }, [habit.id, habit.name]);

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

  return (
    <li className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
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
        className="h-8 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
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
        Rename or remove habits in this list.
      </p>
      <ul className="space-y-1">
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
