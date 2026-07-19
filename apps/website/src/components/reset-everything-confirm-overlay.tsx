import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";

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

  const handleClose = () => {
    setConfirmation("");
    onCancel();
  };

  const handleConfirm = () => {
    setConfirmation("");
    onConfirm();
  };

  return (
    <ViewportOverlay
      open={open}
      title="Reset everything"
      titleId="reset-everything-confirm-title"
      onClose={handleClose}
    >
      <p className="text-sm text-muted-foreground">
        This clears this device&apos;s Local store and deletes all cloud Entries. Your account stays
        signed in. Type {RESET_CONFIRMATION} to confirm.
      </p>
      <label className="text-sm font-medium" htmlFor="reset-confirmation">
        Type RESET to confirm
      </label>
      <input
        id="reset-confirmation"
        name="reset-confirmation"
        type="text"
        autoComplete="off"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        className="h-8 w-full rounded-none border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={confirmation !== RESET_CONFIRMATION}
        >
          Reset everything
        </Button>
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </ViewportOverlay>
  );
}
