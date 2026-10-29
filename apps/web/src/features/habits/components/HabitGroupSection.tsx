import { useState } from "react";
import { List, Trash2 } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Board, Completion, HabitGroup, ToggleCompletionRequest } from "../types";
import { useUpdateGroup } from "../hooks";
import { formatDurationMinutes } from "../lib/dayEstimate";
import { getSubCategoryColor } from "../lib/subCategoryColors";
import HabitTable from "./HabitTable";
import NotesEditor from "./NotesEditor";
import ManageHabitsDialog from "./ManageHabitsDialog";
import DeleteSubCategoryDialog from "./DeleteSubCategoryDialog";
import SubCategoryColorPicker from "./SubCategoryColorPicker";

type HabitGroupSectionProps = {
  group: HabitGroup;
  board: Board;
  completions: Completion[];
  subGroupColors: Record<number, string>;
  onToggle: (data: ToggleCompletionRequest) => void;
  isCore?: boolean;
  onLinkedClick?: (subGroupId: number) => void;
  activeHabitId?: number | null;
  activeStartedAt?: string | null;
  previousDurations?: Record<string, number>;
  onStartTimer?: (habitId: number) => void;
  onFinishTimer?: () => void;
  onDiscardTimer?: () => void;
  timerBusy?: boolean;
};

export default function HabitGroupSection({
  group,
  board,
  completions,
  subGroupColors,
  onToggle,
  isCore = false,
  onLinkedClick,
  activeHabitId = null,
  activeStartedAt = null,
  previousDurations,
  onStartTimer,
  onFinishTimer,
  onDiscardTimer,
  timerBusy = false,
}: HabitGroupSectionProps) {
  const { openModal, closeModal } = useModal();
  const { mutate: updateGroup, isPending: isRenaming } = useUpdateGroup();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const sectionColor = !isCore ? getSubCategoryColor(group.color) : null;

  const groupHabits = board.habits.filter(
    (h) => h.group_id === group.id && h.linked_sub_group_id == null,
  );
  const deletableCount = groupHabits.length;
  const groupTotalMinutes = groupHabits.reduce(
    (sum, h) => sum + h.duration_minutes,
    0,
  );

  const startRename = () => {
    if (isCore) return;
    setNameDraft(group.name);
    setEditingName(true);
  };

  const cancelRename = () => {
    setEditingName(false);
    setNameDraft(group.name);
  };

  const saveRename = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === group.name) {
      cancelRename();
      return;
    }
    updateGroup(
      { id: group.id, data: { name: trimmed } },
      {
        onSuccess: () => setEditingName(false),
        onError: () => {
          setNameDraft(group.name);
          setEditingName(false);
        },
      },
    );
  };

  const handleManage = () => {
    openModal({
      title: isCore ? "Manage Core habits" : `Manage ${group.name} habits`,
      content: (
        <ManageHabitsDialog
          groupId={group.id}
          onClose={closeModal}
        />
      ),
    });
  };

  const handleDelete = () => {
    openModal({
      title: "Delete sub-category",
      content: (
        <DeleteSubCategoryDialog
          groupId={group.id}
          name={group.name}
          onClose={closeModal}
        />
      ),
    });
  };

  return (
    <section
      id={isCore ? "core" : `sub-${group.id}`}
      className="scroll-mt-8"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {!isCore && (
            <SubCategoryColorPicker groupId={group.id} color={group.color} />
          )}
          {editingName ? (
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveRename();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelRename();
                }
              }}
              disabled={isRenaming}
              autoFocus
              aria-label="Sub-category name"
              className={cn(
                "h-8 max-w-xs text-base font-semibold tracking-tight",
                sectionColor?.text,
              )}
              style={sectionColor?.styles?.text}
            />
          ) : (
            <h2
              className={cn(
                "truncate text-base font-semibold tracking-tight",
                sectionColor?.text ?? "text-foreground",
                !isCore &&
                  "cursor-text rounded-sm px-1 -mx-1 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              )}
              style={sectionColor?.styles?.text}
              title={!isCore ? "Click to rename" : undefined}
              onClick={startRename}
              onKeyDown={(e) => {
                if (!isCore && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  startRename();
                }
              }}
              tabIndex={!isCore ? 0 : undefined}
              role={!isCore ? "button" : undefined}
            >
              {group.name}
            </h2>
          )}
          {!isCore && groupTotalMinutes > 0 && (
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground/70">
              {formatDurationMinutes(groupTotalMinutes)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {deletableCount > 0 && (
            <IconTooltipButton
              variant="outline"
              size="icon-sm"
              className="border-border/70 bg-background text-muted-foreground"
              tooltip="Manage habits"
              onClick={handleManage}
            >
              <List className="size-3.5" />
            </IconTooltipButton>
          )}
          {!isCore && (
            <IconTooltipButton
              variant="outline"
              size="icon-sm"
              className="border-border/70 bg-background text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              tooltip="Delete sub-category"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
            </IconTooltipButton>
          )}
        </div>
      </div>

      <HabitTable
        groupId={group.id}
        groupColorId={isCore ? undefined : group.color}
        habits={board.habits}
        lookbackDays={board.settings.lookback_days}
        dayStartTime={board.settings.day_start_time}
        subGroupNames={Object.fromEntries(board.sub_groups.map((g) => [g.id, g.name]))}
        completions={completions}
        subGroupColors={subGroupColors}
        onToggle={onToggle}
        onLinkedClick={onLinkedClick}
        activeHabitId={activeHabitId}
        activeStartedAt={activeStartedAt}
        previousDurations={previousDurations}
        onStartTimer={onStartTimer}
        onFinishTimer={onFinishTimer}
        onDiscardTimer={onDiscardTimer}
        timerBusy={timerBusy}
      />

      <NotesEditor groupId={group.id} notes={group.notes} />
    </section>
  );
}
