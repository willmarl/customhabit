import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";
import type { Board, Completion, HabitGroup, ToggleCompletionRequest } from "../types";
import HabitTable from "./HabitTable";
import NotesEditor from "./NotesEditor";
import EditHabitsDialog from "./EditHabitsDialog";
import DeleteSubCategoryDialog from "./DeleteSubCategoryDialog";

type HabitGroupSectionProps = {
  group: HabitGroup;
  board: Board;
  completions: Completion[];
  onToggle: (data: ToggleCompletionRequest) => void;
  isCore?: boolean;
  onLinkedClick?: (subGroupId: number) => void;
};

export default function HabitGroupSection({
  group,
  board,
  completions,
  onToggle,
  isCore = false,
  onLinkedClick,
}: HabitGroupSectionProps) {
  const { openModal, closeModal } = useModal();

  const handleEdit = () => {
    openModal({
      title: isCore ? "Edit Core habits" : `Edit ${group.name} habits`,
      content: (
        <EditHabitsDialog
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {group.name}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          {!isCore && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <HabitTable
        groupId={group.id}
        habits={board.habits}
        lookbackDays={board.settings.lookback_days}
        completions={completions}
        onToggle={onToggle}
        onLinkedClick={onLinkedClick}
      />

      <NotesEditor groupId={group.id} notes={group.notes} />
    </section>
  );
}
