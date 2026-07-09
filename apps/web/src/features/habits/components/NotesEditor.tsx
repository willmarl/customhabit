import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUpdateGroup } from "../hooks";
import NotesMarkdownView from "./NotesMarkdownView";

type NotesEditorProps = {
  groupId: number;
  notes: string;
};

const notepadClassName =
  "min-h-[72px] rounded-md border border-dashed border-border px-3 py-2 text-left";

export default function NotesEditor({ groupId, notes }: NotesEditorProps) {
  const [value, setValue] = useState(notes);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(() => notes.trim().length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: updateGroup } = useUpdateGroup();

  useEffect(() => {
    if (!editing) setValue(notes);
  }, [notes, editing]);

  useEffect(() => {
    if (notes.trim().length > 0) setOpen(true);
  }, [notes]);

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

  const startEditing = () => {
    setOpen(true);
    setEditing(true);
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span>Notes</span>
        {!open && value.trim() && (
          <span className="truncate text-xs text-muted-foreground/70">
            — has content
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2">
          {editing ? (
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
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={startEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  startEditing();
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
          )}
        </div>
      )}
    </div>
  );
}
