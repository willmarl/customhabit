import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useModal } from "@/components/providers/ModalProvider";
import { parseServerDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  useCreateSnapshot,
  useRestoreSnapshot,
  useSnapshot,
  useSnapshots,
} from "@/features/habits/hooks";
import SnapshotBoardPreview from "@/features/habits/components/SnapshotBoardPreview";

function formatSnapshotDate(iso: string): string {
  return parseServerDateTime(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RestoreSnapshotDialog({
  snapshotId,
  snapshotName,
  onRestored,
}: {
  snapshotId: number;
  snapshotName: string;
  onRestored: () => void;
}) {
  const { mutateAsync: restoreSnapshot } = useRestoreSnapshot();

  return (
    <ConfirmModal
      message={`Replace your current active habits with "${snapshotName}"? Completions tied to current habits stay in history but won't appear on the new layout.`}
      variant="destructive"
      buttonMessage="Restore snapshot"
      onConfirm={async () => {
        await restoreSnapshot(snapshotId);
        onRestored();
      }}
    />
  );
}

export default function SnapshotsPage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { data: snapshots = [], isLoading, isError } = useSnapshots();
  const { mutate: createSnapshot, isPending: isCreating } = useCreateSnapshot();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");

  const { data: selectedSnapshot, isLoading: isLoadingDetail } = useSnapshot(selectedId);

  useEffect(() => {
    if (name === "") {
      setName(`my_habits_v${snapshots.length + 1}`);
    }
  }, [snapshots.length, name]);

  useEffect(() => {
    if (snapshots.length > 0 && selectedId == null) {
      setSelectedId(snapshots[0].id);
    }
  }, [snapshots, selectedId]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createSnapshot(
      { name: trimmed },
      {
        onSuccess: (detail) => {
          setSelectedId(detail.id);
          setName(`my_habits_v${snapshots.length + 2}`);
        },
      },
    );
  };

  const handleRestore = (id: number, snapshotName: string) => {
    openModal({
      title: `Restore "${snapshotName}"?`,
      content: (
        <RestoreSnapshotDialog
          snapshotId={id}
          snapshotName={snapshotName}
          onRestored={() => navigate("/")}
        />
      ),
    });
  };

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Loading snapshots…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Failed to load snapshots. Is the API running?
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8 text-left">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Habit snapshots</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Frozen copies of your habit layout — like{" "}
          <code className="text-xs">my_habits_v1</code>. Browse history here; restore
          replaces your active board.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4"
      >
        <div className="min-w-[12rem] flex-1 space-y-2">
          <Label htmlFor="snapshot-name">Save current board as</Label>
          <Input
            id="snapshot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my_habits_v2"
          />
        </div>
        <Button type="submit" disabled={isCreating || !name.trim()}>
          {isCreating ? "Saving…" : "Save snapshot"}
        </Button>
      </form>

      {snapshots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No snapshots yet. Save one before a big habit reshuffle.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,14rem)_1fr]">
          <aside className="space-y-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Saved versions
            </p>
            {snapshots.map((snap) => (
              <button
                key={snap.id}
                type="button"
                onClick={() => setSelectedId(snap.id)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  selectedId === snap.id
                    ? "border-border bg-muted"
                    : "border-transparent hover:border-border/60 hover:bg-muted/50",
                )}
              >
                <span className="block truncate font-medium">{snap.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatSnapshotDate(snap.created_at)}
                </span>
              </button>
            ))}
          </aside>

          <div className="min-w-0 rounded-md border border-border bg-card p-4">
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">
                Select a snapshot to preview its layout.
              </p>
            ) : isLoadingDetail || !selectedSnapshot ? (
              <p className="text-sm text-muted-foreground">Loading snapshot…</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{selectedSnapshot.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Saved {formatSnapshotDate(selectedSnapshot.created_at)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleRestore(selectedSnapshot.id, selectedSnapshot.name)
                    }
                  >
                    Restore to active board
                  </Button>
                </div>
                <SnapshotBoardPreview payload={selectedSnapshot.payload} />
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Link to="/" className="underline hover:text-foreground">
          Back to habits
        </Link>
      </p>
    </div>
  );
}
