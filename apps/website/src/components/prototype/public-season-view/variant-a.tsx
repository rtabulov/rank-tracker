import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { PROTO_DISPLAY_NAME, PROTO_PUBLIC_LINK, type ProtoScreen } from "./mock-data";
import {
  ProtoAppShell,
  ProtoDataSheetFrame,
  ProtoEyebrow,
  ProtoSeasonChrome,
  StickyTrackCta,
} from "./shared";

/** A — Compact inline: toggle + copy on the Display name row; sticky visitor CTA. */
export function VariantA({ screen }: { screen: ProtoScreen }) {
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  if (screen === "settings") {
    return (
      <ProtoAppShell eyebrow={<ProtoEyebrow>{PROTO_DISPLAY_NAME}</ProtoEyebrow>}>
        <ProtoDataSheetFrame>
          <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-background/60 px-3 py-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Display name: </span>
              <span className="font-medium text-foreground">{PROTO_DISPLAY_NAME}</span>
            </p>
            <div className="flex items-center gap-1">
              <Toggle
                pressed={isPublic}
                onPressedChange={setIsPublic}
                variant="outline"
                size="sm"
                className="rounded-none"
                aria-label="Public Season view"
              >
                {isPublic ? "Public" : "Private"}
              </Toggle>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="rounded-none"
                disabled={!isPublic}
                aria-label="Copy Public link"
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    `${window.location.origin}${PROTO_PUBLIC_LINK}`,
                  );
                  setCopied(true);
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>
          {isPublic && (
            <p className="font-sans text-xs text-muted-foreground">
              Public link: {PROTO_PUBLIC_LINK}
              {copied ? " · copied" : ""}
            </p>
          )}
        </ProtoDataSheetFrame>
      </ProtoAppShell>
    );
  }

  if (screen === "unavailable") {
    return (
      <ProtoAppShell eyebrow={<ProtoEyebrow>Public link</ProtoEyebrow>}>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-start gap-3 px-4 pb-8 pt-10">
          <h2 className="font-heading text-xl font-bold tracking-[0.12em] text-foreground">
            Public Season view unavailable
          </h2>
          <p className="text-sm text-muted-foreground">This Public link isn’t available.</p>
          <Button type="button" variant="outline" className="rounded-none bg-background">
            Track your own RS
          </Button>
        </main>
      </ProtoAppShell>
    );
  }

  return (
    <ProtoAppShell eyebrow={<ProtoEyebrow>{PROTO_DISPLAY_NAME}</ProtoEyebrow>}>
      <ProtoSeasonChrome
        mode={screen === "empty" ? "empty" : "populated"}
        dockCta
        cta={<StickyTrackCta />}
      />
    </ProtoAppShell>
  );
}

VariantA.displayName = "Compact inline";
