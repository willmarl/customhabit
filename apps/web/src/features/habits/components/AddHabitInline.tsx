import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { useCreateHabit } from "../hooks";

type AddHabitInlineProps = {
  groupId: number;
  dateColumnCount?: number;
};

export default function AddHabitInline({
  groupId,
  dateColumnCount = 0,
}: AddHabitInlineProps) {
  const [name, setName] = useState("");
  const { mutate: createHabit, isPending } = useCreateHabit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createHabit(
      { group_id: groupId, name: trimmed },
      { onSuccess: () => setName("") },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-b border-border/50 py-2"
    >
      <div className="size-4 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-6 shrink-0" aria-hidden />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add habit…"
          className="h-8 flex-1 border-dashed border-border/70 bg-transparent text-sm shadow-none"
        />
        <IconTooltipButton
          type="submit"
          variant="outline"
          size="sm"
          tooltip="Add habit"
          disabled={isPending || !name.trim()}
          className="shrink-0"
        >
          <Plus className="size-3.5" />
          Add
        </IconTooltipButton>
      </div>
      {dateColumnCount > 0 && (
        <div
          className="shrink-0"
          style={{ width: dateColumnCount * 30 }}
          aria-hidden
        />
      )}
    </form>
  );
}
