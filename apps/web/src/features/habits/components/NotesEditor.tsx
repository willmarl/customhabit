import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUpdateGroup } from "../hooks";
import NotesMarkdownView from "./NotesMarkdownView";

type NotesEditorProps = {
  groupId: number;
  notes: string;
};

const notepadClassName =
  "mt-4 min-h-[72px] rounded-md border border-dashed border-border/70 px-3 py-2 text-left";

export default function NotesEditor({ groupId, notes }: NotesEditorProps) {
  const [value, setValue] = useState(notes);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: updateGroup } = useUpdateGroup();

  useEffect(() => {
    if (!editing) setValue(notes);
  }, [notes, editing]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing || value === notes) return;
    const timer = setTimeout(() => {
      updateGroup({ id: groupId, data: { notes: value } });
    }, 800);
    return () => clearTimeout(timer);
  }, [value, notes, editing, groupId, updateGroup]);

  const handleBlur = () => {
    setEditing(false);
    if (value !== notes) {
      updateGroup({ id: groupId, data: { notes: value } });
    }
  };

  if (editing) {
    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Optional notes… (markdown supported)"
        className={cn(
          notepadClassName,
          "min-h-[96px] resize-y border-dashed bg-transparent text-sm shadow-none focus-visible:ring-1",
        )}
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={cn(
        notepadClassName,
        "cursor-text transition-colors hover:border-border",
      )}
      aria-label="Edit notes"
    >
      {value.trim() ? (
        <NotesMarkdownView value={value} />
      ) : (
        <p className="text-sm text-muted-foreground/70">
          Optional notes… (markdown supported)
        </p>
      )}
    </div>
  );
}
