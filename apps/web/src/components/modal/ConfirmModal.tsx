import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type Props = {
  message: string;
  onConfirm: () => void | Promise<void>;
  variant?: ButtonVariant;
  buttonMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function ConfirmModal({
  message,
  onConfirm,
  variant = "outline",
  buttonMessage = "Yes",
  onSuccess,
  onError,
}: Props) {
  const { closeModal } = useModal();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      closeModal();
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <p>{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button variant={variant} onClick={handleConfirm}>
          {buttonMessage}
        </Button>
      </div>
    </div>
  );
}
