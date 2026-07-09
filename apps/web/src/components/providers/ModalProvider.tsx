import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ModalVariant = "default" | "naked";

type ModalState = {
  isOpen: boolean;
  title?: string;
  content?: ReactNode;
  variant?: ModalVariant;
};

type ModalContextType = {
  openModal: (options: { title: string; content: ReactNode; variant?: ModalVariant }) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ isOpen: false });

  const openModal = (options: { title: string; content: ReactNode; variant?: ModalVariant }) => {
    setModal({ isOpen: true, ...options, variant: options.variant ?? "default" });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Dialog open={modal.isOpen} onOpenChange={closeModal}>
        {modal.variant === "naked" ? (
          <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-screen-lg w-auto">
            <DialogTitle className="sr-only">{modal.title}</DialogTitle>
            <DialogDescription className="sr-only">Modal dialog</DialogDescription>
            {modal.content}
          </DialogContent>
        ) : (
          <DialogContent>
            <DialogTitle>{modal.title}</DialogTitle>
            <DialogDescription className="sr-only">Modal dialog</DialogDescription>
            <div className="mt-4 p-1 max-h-[calc(100vh-200px)] overflow-y-auto">
              {modal.content}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}
