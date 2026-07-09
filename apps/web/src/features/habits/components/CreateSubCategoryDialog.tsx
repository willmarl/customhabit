import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateSubGroup } from "../hooks";

type CreateSubCategoryDialogProps = {
  onClose: () => void;
};

export default function CreateSubCategoryDialog({
  onClose,
}: CreateSubCategoryDialogProps) {
  const [name, setName] = useState("");
  const { mutate: createSubGroup, isPending } = useCreateSubGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createSubGroup({ name: trimmed }, { onSuccess: () => onClose() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="sub-name">Sub-category name</Label>
        <Input
          id="sub-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chore, Tier 1"
          autoFocus
          className="mt-1.5"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          A linked row will be added to Core automatically.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          Create
        </Button>
      </div>
    </form>
  );
}
