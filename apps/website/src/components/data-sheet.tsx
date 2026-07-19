import { Button } from "@/components/ui/button";
import { ViewportOverlay } from "@/components/viewport-overlay";
import type { AuthSession } from "@/lib/auth";

type DataSheetProps = {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImportClick: () => void;
  exportError: string | null;
  importError: string | null;
  session: AuthSession | null;
  authStatus: "loading" | "ready";
  magicLinkEmail: string;
  onMagicLinkEmailChange: (email: string) => void;
  onSignInWithDiscord: () => void;
  onSignInWithGoogle: () => void;
  onSendMagicLink: () => void;
  onSignOut: () => void;
  authError: string | null;
  magicLinkSent: boolean;
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
  magicLinkEmail,
  onMagicLinkEmailChange,
  onSignInWithDiscord,
  onSignInWithGoogle,
  onSendMagicLink,
  onSignOut,
  authError,
  magicLinkSent,
}: DataSheetProps) {
  const signedIn = session !== null;

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
                <Button type="button" variant="outline" onClick={onSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onSignInWithDiscord}>
                  Sign in with Discord
                </Button>
                <Button type="button" variant="outline" onClick={onSignInWithGoogle}>
                  Sign in with Google
                </Button>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" htmlFor="magic-link-email">
                    Email
                  </label>
                  <input
                    id="magic-link-email"
                    name="magic-link-email"
                    type="email"
                    autoComplete="email"
                    value={magicLinkEmail}
                    onChange={(event) => onMagicLinkEmailChange(event.target.value)}
                    className="h-8 rounded-none border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <Button type="button" variant="outline" onClick={onSendMagicLink}>
                  Send magic link
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
      </div>
    </ViewportOverlay>
  );
}
