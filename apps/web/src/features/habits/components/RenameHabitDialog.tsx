import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { Habit } from "../types";

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
  const { mutate: updateHabit, isPending } = useUpdateHabit();

  useEffect(() => {
    setName(habit.name);
  }, [habit.id, habit.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === habit.name) {
      onOpenChange(false);
      return;
    }
    updateHabit(
      { id: habit.id, data: { name: trimmed } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename habit</DialogTitle>
            <DialogDescription className="sr-only">
              Change the habit name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="mt-1.5"
            />
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
