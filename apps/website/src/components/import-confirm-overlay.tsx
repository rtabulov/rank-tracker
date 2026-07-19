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

type ImportConfirmOverlayProps = {
  open: boolean;
  showCloudSyncWarning: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ImportConfirmOverlay({
  open,
  showCloudSyncWarning,
  onConfirm,
  onCancel,
}: ImportConfirmOverlayProps) {
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
          <AlertDialogTitle>Import</AlertDialogTitle>
          <AlertDialogDescription>
            {showCloudSyncWarning
              ? "This will replace your current Local store. Cloud sync will upload the imported Local store to your account. Continue?"
              : "This will replace your current Local store. Continue?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Replace
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
