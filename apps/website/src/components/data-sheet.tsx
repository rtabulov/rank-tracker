import { Mail } from "lucide-react";
import { DiscordIcon, GoogleIcon } from "@/components/auth-icons";
import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";
import type { AuthSession } from "@/lib/auth";
import { isProfileComplete, type PlayerProfile } from "@/lib/profile";

type DataSheetProps = {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImportClick: () => void;
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
};

export function DataSheet({
  open,
  onClose,
  onExport,
  onImportClick,
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
}: DataSheetProps) {
  const signedIn = session !== null;
  const profileReady = profileStatus === "ready";

  return (
    <ViewportOverlay open={open} title="Data" titleId="data-sheet-title" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {authStatus === "ready" && (
          <section className="flex flex-col gap-3" aria-label="Account">
            {signedIn ? (
              <>
                <p className="text-sm text-muted-foreground" role="status">
                  {session.email !== null ? `Signed in as ${session.email}` : "Signed in"}
                </p>
                {profileReady && isProfileComplete(profile) && profile !== null && (
                  <p className="text-sm text-muted-foreground" role="status">
                    Display name: {profile.displayName}
                  </p>
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
                  <label className="text-sm font-medium" htmlFor="magic-link-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="magic-link-email"
                      name="magic-link-email"
                      type="email"
                      autoComplete="email"
                      value={magicLinkEmail}
                      onChange={(event) => onMagicLinkEmailChange(event.target.value)}
                      className="h-8 w-full rounded-none border border-border bg-background py-0 pr-2.5 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              <p className="text-sm text-destructive" role="alert">
                {authError}
              </p>
            )}
          </section>
        )}

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

        <section
          className="flex flex-col gap-2 border-t border-border pt-4"
          aria-label="Data actions"
        >
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
            <p className="text-sm text-destructive" role="alert">
              {dataActionError}
            </p>
          )}
        </section>
      </div>
    </ViewportOverlay>
  );
}
