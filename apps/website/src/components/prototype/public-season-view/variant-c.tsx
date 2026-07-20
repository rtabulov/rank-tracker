import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { PROTO_DISPLAY_NAME, PROTO_PUBLIC_LINK, type ProtoScreen } from "./mock-data";
import {
  ProtoAppShell,
  ProtoDataSheetFrame,
  ProtoEyebrow,
  ProtoSeasonChrome,
  StickyTrackCta,
} from "./shared";

/**
 * C — Identity-forward: Display name as page title on Public Season view;
 * settings always show dimmed URL preview with Copy gated by the toggle.
 */
export function VariantC({ screen }: { screen: ProtoScreen }) {
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  if (screen === "settings") {
    return (
      <ProtoAppShell eyebrow={<ProtoEyebrow>Account</ProtoEyebrow>}>
        <ProtoDataSheetFrame>
          <div className="flex flex-col gap-1.5">
            <Label>Display name</Label>
            <p className="font-heading text-base tracking-[0.12em] text-foreground">
              {PROTO_DISPLAY_NAME}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="proto-public-toggle">Public Season view</Label>
              <Toggle
                id="proto-public-toggle"
                pressed={isPublic}
                onPressedChange={setIsPublic}
                variant="outline"
                className="rounded-none"
                aria-label="Public Season view"
              >
                {isPublic ? "On" : "Off"}
              </Toggle>
            </div>
            <div
              className={`flex items-center gap-2 border border-border px-3 py-2 font-sans text-sm ${
                isPublic ? "text-foreground" : "text-muted-foreground opacity-50"
              }`}
            >
              <span className="min-w-0 flex-1 break-all">{PROTO_PUBLIC_LINK}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 rounded-none"
                disabled={!isPublic}
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    `${window.location.origin}${PROTO_PUBLIC_LINK}`,
                  );
                  setCopied(true);
                }}
              >
                {copied && isPublic ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </ProtoDataSheetFrame>
      </ProtoAppShell>
    );
  }

  if (screen === "unavailable") {
    return (
      <ProtoAppShell eyebrow={<ProtoEyebrow>Rank Tracker</ProtoEyebrow>} title="Unavailable">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pt-6 pb-4">
          <pre className="overflow-x-auto border border-destructive/40 bg-card/80 p-4 font-sans text-xs leading-relaxed text-muted-foreground">
            {`> PUBLIC_SEASON_VIEW
> STATUS  unavailable
> DETAIL  This Public link isn’t available.`}
          </pre>
          <div className="mt-auto pt-2">
            <StickyTrackCta />
          </div>
        </main>
      </ProtoAppShell>
    );
  }

  return (
    <ProtoAppShell
      eyebrow={<ProtoEyebrow>Rank Tracker · Public</ProtoEyebrow>}
      title={PROTO_DISPLAY_NAME}
    >
      <ProtoSeasonChrome
        mode={screen === "empty" ? "empty" : "populated"}
        dockCta
        cta={<StickyTrackCta />}
      />
    </ProtoAppShell>
  );
}

VariantC.displayName = "Identity-forward";
