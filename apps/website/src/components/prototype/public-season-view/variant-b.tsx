import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { PROTO_DISPLAY_NAME, PROTO_PUBLIC_LINK, type ProtoScreen } from "./mock-data";
import { ProtoAppShell, ProtoDataSheetFrame, ProtoEyebrow, ProtoSeasonChrome } from "./shared";

/** B — Expandable panel for Public link; VIEWING strip; inline (non-sticky) CTA. */
export function VariantB({ screen }: { screen: ProtoScreen }) {
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  if (screen === "settings") {
    return (
      <ProtoAppShell eyebrow={<ProtoEyebrow>{PROTO_DISPLAY_NAME}</ProtoEyebrow>}>
        <ProtoDataSheetFrame>
          <p className="text-sm text-muted-foreground">Display name: {PROTO_DISPLAY_NAME}</p>
          <div className="flex flex-col gap-3 border border-hud-cyan/30 bg-background/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-heading text-xs tracking-[0.2em] text-hud-cyan">
                  Public Season view
                </p>
                <p className="text-xs text-muted-foreground">
                  Anyone with the link can browse your synced Seasons.
                </p>
              </div>
              <Toggle
                pressed={isPublic}
                onPressedChange={setIsPublic}
                variant="outline"
                className="rounded-none"
                aria-label="Enable Public Season view"
              >
                {isPublic ? "On" : "Off"}
              </Toggle>
            </div>
            {isPublic && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <p className="break-all font-sans text-sm text-foreground">{PROTO_PUBLIC_LINK}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={() => {
                    void navigator.clipboard?.writeText(
                      `${window.location.origin}${PROTO_PUBLIC_LINK}`,
                    );
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied Public link" : "Copy Public link"}
                </Button>
              </div>
            )}
          </div>
        </ProtoDataSheetFrame>
      </ProtoAppShell>
    );
  }

  if (screen === "unavailable") {
    return (
      <ProtoAppShell eyebrow={<ProtoEyebrow>Rank Tracker</ProtoEyebrow>}>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-8">
          <div className="border border-border bg-card/70 p-5">
            <h2 className="font-heading text-lg font-bold tracking-[0.12em]">
              Public Season view unavailable
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">This Public link isn’t available.</p>
          </div>
          <Button type="button" variant="link" className="h-auto justify-start px-0">
            Track your own RS →
          </Button>
        </main>
      </ProtoAppShell>
    );
  }

  return (
    <ProtoAppShell eyebrow={<ProtoEyebrow>Season view</ProtoEyebrow>}>
      <ProtoSeasonChrome
        mode={screen === "empty" ? "empty" : "populated"}
        identitySlot={
          <div className="mb-4 flex items-center justify-between gap-2 border border-hud-magenta/35 bg-card/60 px-3 py-2">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-hud-magenta">
              Viewing
            </p>
            <p className="font-heading text-sm tracking-[0.15em] text-foreground">
              {PROTO_DISPLAY_NAME}
            </p>
          </div>
        }
        cta={
          <div className="mt-2">
            <Button type="button" variant="link" className="h-auto px-0 text-sm">
              Track your own RS →
            </Button>
          </div>
        }
      />
    </ProtoAppShell>
  );
}

VariantB.displayName = "Expandable panel";
