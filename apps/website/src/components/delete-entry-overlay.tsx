import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeferredOpen } from "@/hooks/use-deferred-open";
import { formatLocalWhen } from "@/lib/format";
import type { Entry } from "@/lib/types";

type DeleteEntryOverlayProps = {
  open: boolean;
  entry: Entry;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteEntryOverlay({ open, entry, onClose, onConfirm }: DeleteEntryOverlayProps) {
  const deferredOpen = useDeferredOpen(open);

  if (!open) {
    return null;
  }

  return (
    <AlertDialog
      open={deferredOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
          <AlertDialogDescription>
            This Entry will be permanently removed. There is no undo beyond Export/Import.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-sm">
          RS {entry.rs.toLocaleString()} · {formatLocalWhen(entry.recordedAt)}
        </p>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
