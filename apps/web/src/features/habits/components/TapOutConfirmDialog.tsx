import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useTapOut } from "../hooks";

type TapOutConfirmDialogProps = {
  date: string;
};

export default function TapOutConfirmDialog({ date }: TapOutConfirmDialogProps) {
  const { mutateAsync: tapOut } = useTapOut();

  return (
    <ConfirmModal
      message="Finish-time estimates will pause for today. Completions you've already logged are kept."
      variant="destructive"
      buttonMessage="Tap out"
      onConfirm={() => tapOut({ date })}
    />
  );
}
