import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { useUpdateHabit } from "../hooks";
import type { Habit, HabitType, UpdateHabitRequest } from "../types";

type RenameHabitDialogProps = {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type MemberDraft = {
  id: string;
  name: string;
};

let nextMemberId = 0;

function createMember(name = ""): MemberDraft {
  nextMemberId += 1;
  return { id: `round-robin-member-${nextMemberId}`, name };
}

function createMembers(names: string[] | undefined): MemberDraft[] {
  return names?.length
    ? names.map((name) => createMember(name))
    : [createMember(), createMember()];
}

function sameItems(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function validateMembers(items: string[]): string | null {
  const trimmed = items.map((x) => x.trim());
  if (trimmed.some((x) => !x)) {
    return "Members cannot be blank";
  }
  const seen = new Set<string>();
  for (const name of trimmed) {
    const key = name.toLowerCase();
    if (seen.has(key)) return "Members must be unique";
    seen.add(key);
  }
  if (trimmed.length < 2) {
    return "Round robin needs at least two members";
  }
  return null;
}

type SortableMemberRowProps = {
  member: MemberDraft;
  index: number;
  canRemove: boolean;
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
};

function SortableMemberRow({
  member,
  index,
  canRemove,
  onChange,
  onRemove,
}: SortableMemberRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-sm",
        isDragging && "relative z-10 bg-background opacity-90 shadow-sm",
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag member ${index + 1} to reorder`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
        {index + 1}.
      </span>
      <Input
        value={member.name}
        onChange={(e) => onChange(member.id, e.target.value)}
        placeholder={`Member ${index + 1}`}
        className="h-8"
      />
      <IconTooltipButton
        type="button"
        variant="ghost"
        size="icon-xs"
        tooltip="Remove"
        disabled={!canRemove}
        onClick={() => onRemove(member.id)}
        aria-label={`Remove member ${index + 1}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </IconTooltipButton>
    </li>
  );
}

export default function RenameHabitDialog({
  habit,
  open,
  onOpenChange,
}: RenameHabitDialogProps) {
  const [name, setName] = useState(habit.name);
  const [duration, setDuration] = useState(String(habit.duration_minutes));
  const [buffer, setBuffer] = useState(
    String(habit.buffer_minutes ?? 0),
  );
  const [oncePerDay, setOncePerDay] = useState(habit.once_per_day);
  const [habitType, setHabitType] = useState<HabitType>(
    habit.habit_type ?? "normal",
  );
  const [members, setMembers] = useState<MemberDraft[]>(() =>
    createMembers(habit.round_robin_items),
  );
  const [error, setError] = useState<string | null>(null);
  const { mutate: updateHabit, isPending } = useUpdateHabit();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleMemberDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setMembers((prev) => {
      const oldIndex = prev.findIndex((member) => member.id === active.id);
      const newIndex = prev.findIndex((member) => member.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const parsedDuration = parseInt(duration, 10);
    if (Number.isNaN(parsedDuration) || parsedDuration < 1) return;

    const parsedBuffer = parseInt(buffer, 10);
    if (
      Number.isNaN(parsedBuffer) ||
      parsedBuffer < 0 ||
      parsedBuffer >= parsedDuration
    ) {
      setError("Buffer must be ≥ 0 and less than duration");
      return;
    }

    const data: UpdateHabitRequest = {};
    if (trimmed !== habit.name) data.name = trimmed;
    if (parsedDuration !== habit.duration_minutes) {
      data.duration_minutes = parsedDuration;
    }
    if (parsedBuffer !== (habit.buffer_minutes ?? 0)) {
      data.buffer_minutes = parsedBuffer;
    }
    if (oncePerDay !== habit.once_per_day) data.once_per_day = oncePerDay;

    const prevType = habit.habit_type ?? "normal";
    const prevItems = habit.round_robin_items ?? [];

    if (habitType === "round_robin") {
      const memberNames = members.map((member) => member.name);
      const memberError = validateMembers(memberNames);
      if (memberError) {
        setError(memberError);
        return;
      }
      const normalized = memberNames.map((member) => member.trim());
      if (prevType !== "round_robin") data.habit_type = "round_robin";
      if (!sameItems(normalized, prevItems)) {
        data.round_robin_items = normalized;
      }
      if (prevType !== "round_robin" && !data.round_robin_items) {
        data.round_robin_items = normalized;
      }
    } else if (prevType === "round_robin") {
      data.habit_type = "normal";
    }

    setError(null);

    if (Object.keys(data).length === 0) {
      onOpenChange(false);
      return;
    }

    updateHabit({ id: habit.id, data }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription className="sr-only">
              Change habit name, duration, once-per-day, or round-robin settings
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
            <div className="space-y-2">
              <Label htmlFor="habit-buffer">Buffer (minutes)</Label>
              <Input
                id="habit-buffer"
                type="number"
                min={0}
                value={buffer}
                onChange={(e) => {
                  setBuffer(e.target.value);
                  setError(null);
                }}
                className="tabular-nums"
              />
              <p className="text-xs text-muted-foreground">
                Ring this many minutes before your planned duration so you get a
                heads-up while finishing a step — not mid-problem. Timer keeps
                running. Example: 20 min duration + 5 min buffer rings at 15:00.
              </p>
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

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={habitType === "round_robin"}
                onCheckedChange={(v) => {
                  const enabled = v === true;
                  setHabitType(enabled ? "round_robin" : "normal");
                  if (enabled && members.length < 2) {
                    setMembers((prev) =>
                      prev.length >= 2
                        ? prev
                        : [...prev, createMember(), createMember()].slice(0, 2),
                    );
                  }
                  setError(null);
                }}
              />
              <span>
                Round robin
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Cycle through member names each day. Completing the habit still
                  counts for this parent row.
                </span>
              </span>
            </label>

            {habitType === "round_robin" && (
              <div className="space-y-2 rounded-md border border-border/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Members (order = cycle order)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() =>
                      setMembers((prev) => [...prev, createMember()])
                    }
                  >
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleMemberDragEnd}
                >
                  <SortableContext
                    items={members.map((member) => member.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-2">
                      {members.map((member, index) => (
                        <SortableMemberRow
                          key={member.id}
                          member={member}
                          index={index}
                          canRemove={members.length > 2}
                          onChange={(id, value) => {
                            setMembers((prev) =>
                              prev.map((item) =>
                                item.id === id ? { ...item, name: value } : item,
                              ),
                            );
                            setError(null);
                          }}
                          onRemove={(id) =>
                            setMembers((prev) =>
                              prev.filter((item) => item.id !== id),
                            )
                          }
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
            )}
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
