import { List, Trash2 } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { IconTooltipButton } from "@/components/ui/icon-tooltip";
import { cn } from "@/lib/utils";
import type { Board, Completion, HabitGroup, ToggleCompletionRequest } from "../types";
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
};

export default function HabitGroupSection({
  group,
  board,
  completions,
  subGroupColors,
  onToggle,
  isCore = false,
  onLinkedClick,
}: HabitGroupSectionProps) {
  const { openModal, closeModal } = useModal();
  const sectionColor = !isCore ? getSubCategoryColor(group.color) : null;

  const deletableCount = board.habits.filter(
    (h) => h.group_id === group.id && h.linked_sub_group_id == null,
  ).length;

  const handleManage = () => {
    openModal({
      title: isCore ? "Manage Core habits" : `Manage ${group.name} habits`,
      content: (
        <ManageHabitsDialog
          groupId={group.id}
          habits={board.habits}
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
          <h2
            className={cn(
              "truncate text-base font-semibold tracking-tight",
              sectionColor?.text ?? "text-foreground",
            )}
            style={sectionColor?.styles?.text}
          >
            {group.name}
          </h2>
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
      />

      <NotesEditor groupId={group.id} notes={group.notes} />
    </section>
  );
}
