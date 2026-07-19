import { useRef, useState } from "react";
import { Settings } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useLocalStore } from "@/components/local-store-provider";
import { useProfile } from "@/components/profile-provider";
import { DataSheet } from "@/components/data-sheet";
import { ImportConfirmOverlay } from "@/components/import-confirm-overlay";
import { PendingSyncIndicator } from "@/components/pending-sync-indicator";
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
  const [dataOpen, setDataOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<LocalStore | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkSending, setMagicLinkSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeData = () => {
    setDataOpen(false);
    setExportError(null);
    setImportError(null);
    setAuthError(null);
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
      />

      <ImportConfirmOverlay
        open={importConfirmOpen}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />
    </>
  );
}
