import { useRef, useState } from "react";
import { Settings } from "lucide-react";
import { useLocalStore } from "@/components/local-store-provider";
import { DataSheet } from "@/components/data-sheet";
import { ImportConfirmOverlay } from "@/components/import-confirm-overlay";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { downloadExport } from "@/lib/export";
import { validateImportDocument } from "@/lib/import";
import type { LocalStore } from "@/lib/types";

export function HeaderActions() {
  const { store, setStore } = useLocalStore();
  const [dataOpen, setDataOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<LocalStore | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeData = () => {
    setDataOpen(false);
    setExportError(null);
    setImportError(null);
  };

  const handleExport = () => {
    setExportError(null);
    const result = downloadExport(store);
    if (!result.ok) {
      setExportError("Export failed. Check browser download settings.");
    }
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) {
      return;
    }

    setImportError(null);
    const text = await file.text();
    const result = validateImportDocument(text);
    if (!result.ok) {
      setImportError(result.message);
      return;
    }

    setPendingImport(result.store);
    setDataOpen(false);
    setImportConfirmOpen(true);
  };

  const handleImportConfirm = () => {
    if (pendingImport === null) {
      return;
    }
    setStore(pendingImport);
    setPendingImport(null);
    setImportConfirmOpen(false);
    setImportError(null);
  };

  const handleImportCancel = () => {
    setPendingImport(null);
    setImportConfirmOpen(false);
    setDataOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Data"
          onClick={() => setDataOpen(true)}
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <ModeToggle />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />

      <DataSheet
        open={dataOpen}
        onClose={closeData}
        onExport={handleExport}
        onImportClick={handleImportClick}
        exportError={exportError}
        importError={importError}
      />

      <ImportConfirmOverlay
        open={importConfirmOpen}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />
    </>
  );
}
