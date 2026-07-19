import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeferredOpen } from "@/hooks/use-deferred-open";

const RESET_CONFIRMATION = "RESET";

type ResetEverythingConfirmOverlayProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ResetEverythingConfirmOverlay({
  open,
  onConfirm,
  onCancel,
}: ResetEverythingConfirmOverlayProps) {
  const [confirmation, setConfirmation] = useState("");
  const deferredOpen = useDeferredOpen(open);

  const handleClose = () => {
    setConfirmation("");
    onCancel();
  };

  const handleConfirm = () => {
    setConfirmation("");
    onConfirm();
  };

  if (!open) {
    return null;
  }

  return (
    <AlertDialog
      open={deferredOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset everything</AlertDialogTitle>
          <AlertDialogDescription>
            This clears this device&apos;s Local store and deletes all cloud Entries. Your account
            stays signed in. Type {RESET_CONFIRMATION} to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-confirmation">Type RESET to confirm</Label>
          <Input
            id="reset-confirmation"
            name="reset-confirmation"
            type="text"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="rounded-none"
          />
        </div>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmation !== RESET_CONFIRMATION}
          >
            Reset everything
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
