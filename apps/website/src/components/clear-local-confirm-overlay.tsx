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

type ClearLocalConfirmOverlayProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ClearLocalConfirmOverlay({
  open,
  onConfirm,
  onCancel,
}: ClearLocalConfirmOverlayProps) {
  const deferredOpen = useDeferredOpen(open);

  if (!open) {
    return null;
  }

  return (
    <AlertDialog
      open={deferredOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Clear local data</AlertDialogTitle>
          <AlertDialogDescription>
            This wipes this device&apos;s Local store and sync bookkeeping only. Cloud Entries are
            not deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Clear local data
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
