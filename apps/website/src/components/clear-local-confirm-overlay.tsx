import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";

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
  return (
    <ViewportOverlay
      open={open}
      title="Clear local data"
      titleId="clear-local-confirm-title"
      onClose={onCancel}
    >
      <p className="text-sm text-muted-foreground">
        This wipes this device&apos;s Local store and sync bookkeeping only. Cloud Entries are not
        deleted.
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Clear local data
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </ViewportOverlay>
  );
}
