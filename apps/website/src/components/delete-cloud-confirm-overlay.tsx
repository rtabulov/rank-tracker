import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";

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
  return (
    <ViewportOverlay
      open={open}
      title="Delete cloud data"
      titleId="delete-cloud-confirm-title"
      onClose={onCancel}
    >
      <p className="text-sm text-muted-foreground">
        This permanently removes all of your cloud Entries. Your Local store on this device stays
        intact and your account is not deleted.
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Delete cloud data
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </ViewportOverlay>
  );
}
