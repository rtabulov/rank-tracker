import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              name="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="nickname"
              className="rounded-none"
            />
          </div>
          {error !== null && (
            <Alert variant="destructive" className="rounded-none">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={saving} aria-busy={saving}>
            {saving ? "Saving…" : "Save display name"}
          </Button>
        </form>
      </div>
    </section>
  );
}
