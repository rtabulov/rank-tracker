import { Copy, Mail } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { DiscordIcon, GoogleIcon } from "@/components/auth-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ViewportOverlay } from "@/components/viewport-overlay";
import type { AuthSession } from "@/lib/auth";
import { isProfileComplete, type PlayerProfile } from "@/lib/profile";
import { publicSeasonLinkPath } from "@/lib/public-link";

type DataSheetProps = {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImportClick: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  exportError: string | null;
  importError: string | null;
  session: AuthSession | null;
  authStatus: "loading" | "ready";
  profile: PlayerProfile | null;
  profileStatus: "idle" | "loading" | "ready";
  isCloudSyncAllowed: boolean;
  magicLinkEmail: string;
  onMagicLinkEmailChange: (email: string) => void;
  onSignInWithDiscord: () => void;
  onSignInWithGoogle: () => void;
  onSendMagicLink: () => void;
  onSignOut: () => void;
  authError: string | null;
  magicLinkSent: boolean;
  magicLinkSending: boolean;
  onClearLocalClick: () => void;
  onDeleteCloudClick: () => void;
  onResetEverythingClick: () => void;
  dataActionError: string | null;
  onPublicSharingChange: (isPublic: boolean) => void;
  publicSharingError: string | null;
  publicLinkCopied: boolean;
  onCopyPublicLink: () => void;
};

export function DataSheet({
  open,
  onClose,
  onExport,
  onImportClick,
  fileInputRef,
  onImportFileChange,
  exportError,
  importError,
  session,
  authStatus,
  profile,
  profileStatus,
  isCloudSyncAllowed,
  magicLinkEmail,
  onMagicLinkEmailChange,
  onSignInWithDiscord,
  onSignInWithGoogle,
  onSendMagicLink,
  onSignOut,
  authError,
  magicLinkSent,
  magicLinkSending,
  onClearLocalClick,
  onDeleteCloudClick,
  onResetEverythingClick,
  dataActionError,
  onPublicSharingChange,
  publicSharingError,
  publicLinkCopied,
  onCopyPublicLink,
}: DataSheetProps) {
  const signedIn = session !== null;
  const profileReady = profileStatus === "ready";

  return (
    <ViewportOverlay open={open} title="Data" titleId="data-sheet-title" onClose={onClose}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportFileChange}
      />
      <div className="flex flex-col gap-4">
        {authStatus === "ready" && (
          <section className="flex flex-col gap-3" aria-label="Account">
            {signedIn ? (
              <>
                <p className="text-sm text-muted-foreground" role="status">
                  {session.email !== null ? `Signed in as ${session.email}` : "Signed in"}
                </p>
                {profileReady &&
                  isProfileComplete(profile) &&
                  profile !== null &&
                  profile.displayName !== null && (
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-background/60 px-3 py-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Display name: </span>
                          <span className="font-medium text-foreground">{profile.displayName}</span>
                        </p>
                        <div className="flex items-center gap-1">
                          <Toggle
                            pressed={profile.isPublic}
                            onPressedChange={onPublicSharingChange}
                            variant="outline"
                            size="sm"
                            className="rounded-none"
                            aria-label="Public Season view"
                          >
                            {profile.isPublic ? "Public" : "Private"}
                          </Toggle>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="rounded-none"
                            disabled={!profile.isPublic}
                            aria-label="Copy Public link"
                            onClick={onCopyPublicLink}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      {profile.isPublic && (
                        <p className="font-sans text-xs text-muted-foreground">
                          Public link: {publicSeasonLinkPath(profile.displayName)}
                          {publicLinkCopied ? " · copied" : ""}
                        </p>
                      )}
                    </div>
                  )}
                {profileReady && !isCloudSyncAllowed && (
                  <p className="text-sm text-muted-foreground" role="status">
                    Cloud sync blocked until you choose a display name.
                  </p>
                )}
                {profileReady && isCloudSyncAllowed && (
                  <p className="text-sm text-muted-foreground" role="status">
                    Cloud sync ready.
                  </p>
                )}
                <Button type="button" variant="outline" onClick={onSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onSignInWithDiscord}>
                  <DiscordIcon className="size-4" />
                  Sign in with Discord
                </Button>
                <Button type="button" variant="outline" onClick={onSignInWithGoogle}>
                  <GoogleIcon className="size-4" />
                  Sign in with Google
                </Button>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="magic-link-email">Email</Label>
                  <div className="relative">
                    <Mail
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="magic-link-email"
                      name="magic-link-email"
                      type="email"
                      autoComplete="email"
                      value={magicLinkEmail}
                      onChange={(event) => onMagicLinkEmailChange(event.target.value)}
                      className="rounded-none pl-9"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSendMagicLink}
                  disabled={magicLinkSending}
                  aria-busy={magicLinkSending}
                >
                  <Mail aria-hidden className="size-4" />
                  {magicLinkSending ? "Sending…" : "Send magic link"}
                </Button>
                {magicLinkSent && (
                  <p className="text-sm text-muted-foreground" role="status">
                    Check your email for a magic link.
                  </p>
                )}
              </>
            )}
            {authError !== null && (
              <Alert variant="destructive" className="rounded-none">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            {publicSharingError !== null && (
              <Alert variant="destructive" className="rounded-none">
                <AlertDescription>{publicSharingError}</AlertDescription>
              </Alert>
            )}
          </section>
        )}

        <Button type="button" onClick={onExport}>
          Export
        </Button>
        {exportError !== null && (
          <Alert variant="destructive" className="rounded-none">
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}
        <Button type="button" variant="outline" onClick={onImportClick}>
          Import
        </Button>
        {importError !== null && (
          <Alert variant="destructive" className="rounded-none">
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}

        <Separator />

        <section className="flex flex-col gap-2" aria-label="Data actions">
          <p className="text-sm font-medium">Destructive actions</p>
          <Button type="button" variant="outline" onClick={onClearLocalClick}>
            Clear local data
          </Button>
          {signedIn && isCloudSyncAllowed && (
            <>
              <Button type="button" variant="outline" onClick={onDeleteCloudClick}>
                Delete cloud data
              </Button>
              <Button type="button" variant="outline" onClick={onResetEverythingClick}>
                Reset everything
              </Button>
            </>
          )}
          {dataActionError !== null && (
            <Alert variant="destructive" className="rounded-none">
              <AlertDescription>{dataActionError}</AlertDescription>
            </Alert>
          )}
        </section>
      </div>
    </ViewportOverlay>
  );
}
