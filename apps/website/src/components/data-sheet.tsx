import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";

type DataSheetProps = {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImportClick: () => void;
  exportError: string | null;
  importError: string | null;
};

export function DataSheet({
  open,
  onClose,
  onExport,
  onImportClick,
  exportError,
  importError,
}: DataSheetProps) {
  return (
    <ViewportOverlay open={open} title="Data" titleId="data-sheet-title" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Button type="button" onClick={onExport}>
          Export
        </Button>
        {exportError !== null && (
          <p className="text-sm text-destructive" role="alert">
            {exportError}
          </p>
        )}
        <Button type="button" variant="outline" onClick={onImportClick}>
          Import
        </Button>
        {importError !== null && (
          <p className="text-sm text-destructive" role="alert">
            {importError}
          </p>
        )}
      </div>
    </ViewportOverlay>
  );
}
