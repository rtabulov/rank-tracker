import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useProfile } from "@/components/profile-provider";
import { isProfileComplete } from "@/lib/profile";

export function DisplayNameGate() {
  const { session, status: authStatus } = useAuth();
  const { profile, status: profileStatus, saveDisplayName } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (
    authStatus !== "ready" ||
    profileStatus !== "ready" ||
    session === null ||
    isProfileComplete(profile)
  ) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) {
      return;
    }

    setError(null);
    setSaving(true);
    void saveDisplayName(displayName).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDisplayName("");
    });
  };

  return (
    <section
      aria-label="Choose display name"
      className="relative z-20 mx-auto w-full max-w-lg px-4 pb-2"
    >
      <div className="hud-chamfer flex flex-col gap-3 border border-primary/30 bg-card/95 p-4">
        <div>
          <p className="font-heading text-[10px] tracking-[0.35em] text-hud-cyan">ACCOUNT</p>
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.15em] text-primary">
            Choose a display name
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cloud sync stays off until you save a unique name. Log RS and Season view stay
            available.
          </p>
        </div>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="display-name">
              Display name
            </label>
            <input
              id="display-name"
              name="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="nickname"
              className="h-8 rounded-none border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {error !== null && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving} aria-busy={saving}>
            {saving ? "Saving…" : "Save display name"}
          </Button>
        </form>
      </div>
    </section>
  );
}
