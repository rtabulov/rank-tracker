import { useRef, useState } from "react";
import { Settings } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useCloudSync } from "@/components/cloud-sync-provider";
import { useLocalStore } from "@/components/local-store-provider";
import { useProfile } from "@/components/profile-provider";
import { ClearLocalConfirmOverlay } from "@/components/clear-local-confirm-overlay";
import { DataSheet } from "@/components/data-sheet";
import { DeleteCloudConfirmOverlay } from "@/components/delete-cloud-confirm-overlay";
import { ImportConfirmOverlay } from "@/components/import-confirm-overlay";
import { PendingSyncIndicator } from "@/components/pending-sync-indicator";
import { ResetEverythingConfirmOverlay } from "@/components/reset-everything-confirm-overlay";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import type { OAuthProvider } from "@/lib/auth";
import { downloadExport } from "@/lib/export";
import { validateImportDocument } from "@/lib/import";
import type { LocalStore } from "@/lib/types";

export function HeaderActions() {
  const { store, setStore } = useLocalStore();
  const { session, status: authStatus, authClient } = useAuth();
  const { profile, status: profileStatus, isCloudSyncAllowed } = useProfile();
  const { clearLocalData, deleteCloudData, resetEverything } = useCloudSync();
  const [dataOpen, setDataOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [clearLocalConfirmOpen, setClearLocalConfirmOpen] = useState(false);
  const [deleteCloudConfirmOpen, setDeleteCloudConfirmOpen] = useState(false);
  const [resetEverythingConfirmOpen, setResetEverythingConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<LocalStore | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataActionError, setDataActionError] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkSending, setMagicLinkSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeData = () => {
    setDataOpen(false);
    setExportError(null);
    setImportError(null);
    setAuthError(null);
    setDataActionError(null);
    setMagicLinkSent(false);
    setMagicLinkSending(false);
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

  const handleAuthResult = (result: { error: string | null }) => {
    if (result.error !== null) {
      setAuthError(result.error);
    }
  };

  const handleSignInWithOAuth = (provider: OAuthProvider) => {
    setAuthError(null);
    void authClient.signInWithOAuth(provider).then(handleAuthResult);
  };

  const handleSendMagicLink = () => {
    if (magicLinkSending) {
      return;
    }
    setAuthError(null);
    setMagicLinkSent(false);
    setMagicLinkSending(true);
    void authClient.signInWithMagicLink(magicLinkEmail.trim()).then((result) => {
      setMagicLinkSending(false);
      handleAuthResult(result);
      if (result.error === null) {
        setMagicLinkSent(true);
      }
    });
  };

  const handleSignOut = () => {
    setAuthError(null);
    void authClient.signOut().then(handleAuthResult);
  };

  const handleClearLocalClick = () => {
    setDataActionError(null);
    setDataOpen(false);
    setClearLocalConfirmOpen(true);
  };

  const handleClearLocalConfirm = () => {
    clearLocalData();
    setClearLocalConfirmOpen(false);
    setDataActionError(null);
  };

  const handleClearLocalCancel = () => {
    setClearLocalConfirmOpen(false);
    setDataOpen(true);
  };

  const handleDeleteCloudClick = () => {
    setDataActionError(null);
    setDataOpen(false);
    setDeleteCloudConfirmOpen(true);
  };

  const handleDeleteCloudConfirm = () => {
    void deleteCloudData().then((result) => {
      setDeleteCloudConfirmOpen(false);
      if (result.error !== null) {
        setDataActionError(result.error);
        setDataOpen(true);
        return;
      }
      setDataActionError(null);
      setDataOpen(true);
    });
  };

  const handleDeleteCloudCancel = () => {
    setDeleteCloudConfirmOpen(false);
    setDataOpen(true);
  };

  const handleResetEverythingClick = () => {
    setDataActionError(null);
    setDataOpen(false);
    setResetEverythingConfirmOpen(true);
  };

  const handleResetEverythingConfirm = () => {
    void resetEverything().then((result) => {
      setResetEverythingConfirmOpen(false);
      if (result.error !== null) {
        setDataActionError(result.error);
        setDataOpen(true);
        return;
      }
      setDataActionError(null);
      setDataOpen(true);
    });
  };

  const handleResetEverythingCancel = () => {
    setResetEverythingConfirmOpen(false);
    setDataOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <PendingSyncIndicator />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-none border-2"
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
        session={session}
        authStatus={authStatus}
        profile={profile}
        profileStatus={profileStatus}
        isCloudSyncAllowed={isCloudSyncAllowed}
        magicLinkEmail={magicLinkEmail}
        onMagicLinkEmailChange={setMagicLinkEmail}
        onSignInWithDiscord={() => handleSignInWithOAuth("discord")}
        onSignInWithGoogle={() => handleSignInWithOAuth("google")}
        onSendMagicLink={handleSendMagicLink}
        onSignOut={handleSignOut}
        authError={authError}
        magicLinkSent={magicLinkSent}
        magicLinkSending={magicLinkSending}
        onClearLocalClick={handleClearLocalClick}
        onDeleteCloudClick={handleDeleteCloudClick}
        onResetEverythingClick={handleResetEverythingClick}
        dataActionError={dataActionError}
      />

      <ImportConfirmOverlay
        open={importConfirmOpen}
        showCloudSyncWarning={session !== null && isCloudSyncAllowed}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />

      <ClearLocalConfirmOverlay
        open={clearLocalConfirmOpen}
        onConfirm={handleClearLocalConfirm}
        onCancel={handleClearLocalCancel}
      />

      <DeleteCloudConfirmOverlay
        open={deleteCloudConfirmOpen}
        onConfirm={handleDeleteCloudConfirm}
        onCancel={handleDeleteCloudCancel}
      />

      <ResetEverythingConfirmOverlay
        open={resetEverythingConfirmOpen}
        onConfirm={handleResetEverythingConfirm}
        onCancel={handleResetEverythingCancel}
      />
    </>
  );
}
