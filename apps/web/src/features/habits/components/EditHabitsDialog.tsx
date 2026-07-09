import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Habit } from "../types";
import { useCreateHabit, useDeleteHabit } from "../hooks";

type EditHabitsDialogProps = {
  groupId: number;
  habits: Habit[];
  onClose: () => void;
};

export default function EditHabitsDialog({
  groupId,
  habits,
  onClose,
}: EditHabitsDialogProps) {
  const [newName, setNewName] = useState("");
  const { mutate: createHabit, isPending: creating } = useCreateHabit();
  const { mutate: deleteHabit } = useDeleteHabit();

  const editable = habits
    .filter((h) => h.group_id === groupId && h.linked_sub_group_id == null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    createHabit(
      { group_id: groupId, name: trimmed },
      { onSuccess: () => setNewName("") },
    );
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-1">
        {editable.length === 0 && (
          <li className="text-sm text-muted-foreground">No habits yet.</li>
        )}
        {editable.map((habit) => (
          <li
            key={habit.id}
            className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
          >
            <span>{habit.name}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => deleteHabit(habit.id)}
              aria-label={`Delete ${habit.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="space-y-2">
        <Label htmlFor="new-habit">Add habit</Label>
        <div className="flex gap-2">
          <Input
            id="new-habit"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Habit name"
          />
          <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </form>

      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
