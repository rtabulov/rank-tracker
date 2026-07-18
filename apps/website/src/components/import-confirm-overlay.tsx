import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";

type ImportConfirmOverlayProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ImportConfirmOverlay({ open, onConfirm, onCancel }: ImportConfirmOverlayProps) {
  return (
    <ViewportOverlay open={open} title="Import" titleId="import-confirm-title" onClose={onCancel}>
      <p className="text-sm text-muted-foreground">
        This will replace your current Local store. Continue?
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Replace
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </ViewportOverlay>
  );
}
