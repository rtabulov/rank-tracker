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

type DeleteCloudConfirmOverlayProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteCloudConfirmOverlay({
  open,
  onConfirm,
  onCancel,
}: DeleteCloudConfirmOverlayProps) {
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
          <AlertDialogTitle>Delete cloud data</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes all of your cloud Entries. Your Local store on this device
            stays intact and your account is not deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete cloud data
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
