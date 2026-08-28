import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Download, ExternalLink } from "lucide-react";
import {
  COMPANION_BETA_DISCLAIMERS,
  COMPANION_KNOWN_ISSUES_URL,
  COMPANION_REPO_RELEASES_URL,
} from "companion-lifecycle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  fetchCompanionDownloadTarget,
  type CompanionDownloadTarget,
} from "@/lib/companion-download";

export const Route = createFileRoute("/companion")({
  ssr: false,
  loader: async () => {
    try {
      return await fetchCompanionDownloadTarget();
    } catch {
      return { kind: "releases-index" } satisfies CompanionDownloadTarget;
    }
  },
  component: CompanionDownloadPage,
});

function CompanionDownloadPage() {
  const download = Route.useLoaderData();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <section className="hud-chamfer space-y-3 border border-primary/30 bg-card/80 p-4">
        <p className="font-heading text-[10px] tracking-[0.35em] text-hud-cyan">Windows only</p>
        <h2 className="font-heading text-xl font-black uppercase tracking-[0.15em] text-primary">
          Rank Tracker Companion
        </h2>
        <p className="text-sm text-muted-foreground">
          Free tray app for THE FINALS. Captures your own Rank Score from local HTTPS traffic and
          prefills Log RS in the Rank Tracker PWA — you still confirm Save. Optional; manual logging
          works without it.
        </p>
        <DownloadCta download={download} />
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Private beta disclaimers
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {COMPANION_BETA_DISCLAIMERS.map((line) => (
            <li key={line} className="flex gap-2">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="known-issues" className="scroll-mt-24 space-y-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Known issues
        </h3>
        <Alert variant="destructive" className="rounded-none border-destructive/40">
          <AlertTriangle />
          <AlertTitle>Open beta gates</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-2 pl-4">
              <li>
                <strong>SSLKEYLOGFILE inheritance</strong> — MSI sets per-user key logging; Steam
                and THE FINALS must fully restart to pick it up. Validate after major patches.
              </li>
              <li>
                <strong>GPL counsel pending</strong> — bundled <code>tshark</code> is GPL; public
                stable release waits on compliance review.
              </li>
              <li>
                <strong>Signing pending</strong> — beta MSI is unsigned; SmartScreen warnings are
                expected. Authenticode required for public stable.
              </li>
            </ul>
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Maintainer docs:{" "}
          <a
            href="https://github.com/rtabulov/rank-tracker/blob/main/docs/companion/known-issues.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            known-issues.md
          </a>
          {" · "}
          <a
            href="https://github.com/rtabulov/rank-tracker/blob/main/docs/companion/smoke-test-checklist.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            smoke-test checklist
          </a>
          {" · "}
          <a
            href="https://github.com/rtabulov/rank-tracker/blob/main/docs/companion/release.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            release train
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          Capture broken in the tray?{" "}
          <a
            href={COMPANION_KNOWN_ISSUES_URL}
            className="text-primary underline-offset-4 hover:underline"
          >
            Jump to known issues
          </a>{" "}
          or check{" "}
          <a
            href={COMPANION_REPO_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            GitHub pre-releases
          </a>
          .
        </p>
      </section>

      <section className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
        <p>
          Public stable release is <strong className="text-foreground">not available</strong> until
          GPL inventory and code signing are complete.{" "}
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Back to Rank Tracker
          </Link>
        </p>
      </section>
    </main>
  );
}

function DownloadCta({ download }: { download: CompanionDownloadTarget }) {
  if (download.kind === "msi") {
    return (
      <div className="space-y-2">
        <Button type="button" className="w-full" asChild>
          <a href={download.downloadUrl} rel="noopener noreferrer">
            <Download aria-hidden="true" />
            Download pre-release MSI ({download.tagName})
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">
          Asset: {download.assetName}. Unsigned — see disclaimers below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" asChild>
        <a href={COMPANION_REPO_RELEASES_URL} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden="true" />
          View GitHub pre-releases
        </a>
      </Button>
      <p className="text-xs text-muted-foreground">
        No pre-release MSI is published yet. Download the latest <strong>Pre-release</strong> from
        GitHub when available.
      </p>
    </div>
  );
}
