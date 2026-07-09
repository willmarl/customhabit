import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useDeleteSubGroup } from "../hooks";

type DeleteSubCategoryDialogProps = {
  groupId: number;
  name: string;
  onClose: () => void;
};

export default function DeleteSubCategoryDialog({
  groupId,
  name,
  onClose,
}: DeleteSubCategoryDialogProps) {
  const { mutateAsync: deleteSubGroup } = useDeleteSubGroup();

  return (
    <ConfirmModal
      message={`Delete "${name}" and its linked Core row? This cannot be undone.`}
      onConfirm={async () => {
        await deleteSubGroup(groupId);
        onClose();
      }}
      variant="destructive"
      buttonMessage="Delete"
    />
  );
}
