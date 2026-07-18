import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";
import { formatLocalWhen } from "@/lib/format";
import type { Entry } from "@/lib/types";

type DeleteEntryOverlayProps = {
  open: boolean;
  entry: Entry;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteEntryOverlay({ open, entry, onClose, onConfirm }: DeleteEntryOverlayProps) {
  return (
    <ViewportOverlay
      open={open}
      title="Delete Entry"
      titleId="delete-entry-title"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          This Entry will be permanently removed. There is no undo beyond Export/Import.
        </p>
        <p className="text-sm">
          RS {entry.rs.toLocaleString()} · {formatLocalWhen(entry.recordedAt)}
        </p>
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </ViewportOverlay>
  );
}
