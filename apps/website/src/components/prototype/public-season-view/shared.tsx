import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLocalWhen, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PROTO_POPULATED_ENTRIES, type ProtoEntry } from "./mock-data";

export function ProtoAppShell({
  eyebrow,
  title = "Rank Tracker",
  children,
}: {
  eyebrow: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] hud-scanlines"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--hud-cyan)_12%,transparent),transparent_55%)]"
        aria-hidden="true"
      />
      <header className="relative z-10 mx-auto w-full max-w-lg px-4 pt-4">
        <div className="hud-chamfer flex items-start justify-between gap-3 border border-primary/30 bg-card/80 p-3">
          <div>
            {eyebrow}
            <h1 className="font-heading text-lg font-black uppercase tracking-[0.2em] text-primary hud-glow-primary">
              {title}
            </h1>
          </div>
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Proto
          </span>
        </div>
      </header>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function ProtoEyebrow({ children }: { children: ReactNode }) {
  return <p className="font-heading text-[10px] tracking-[0.35em] text-hud-cyan">{children}</p>;
}

export function ProtoDataSheetFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-8 pt-5">
      <div className="border border-primary/30 bg-card/80 p-4">
        <p className="mb-4 font-heading text-sm tracking-[0.2em] text-primary">Data</p>
        <section className="flex flex-col gap-3" aria-label="Account">
          <p className="text-sm text-muted-foreground">Signed in as player@example.com</p>
          {children}
          <Button type="button" variant="outline" disabled>
            Sign out
          </Button>
        </section>
      </div>
    </main>
  );
}

export function ProtoSeasonChrome({
  mode,
  identitySlot,
  cta,
  dockCta = false,
}: {
  mode: "populated" | "empty";
  identitySlot?: ReactNode;
  cta: ReactNode;
  /** Pin CTA to the bottom of the shell (above the variant switcher). */
  dockCta?: boolean;
}) {
  const entries = mode === "populated" ? PROTO_POPULATED_ENTRIES : [];
  const isEmpty = entries.length === 0;
  const latest = entries.at(-1);
  const first = entries[0];
  const seasonNet = latest !== undefined && first !== undefined ? latest.rs - first.rs : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-5 pb-4">
      {identitySlot}
      <section aria-label="Season hero" className="mb-5 flex flex-col gap-2">
        <p className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.3em] text-hud-magenta">
          <span>S11</span>
          <Badge
            variant="outline"
            className="rounded-none border-hud-magenta/40 px-1.5 font-sans text-[10px] tracking-[0.3em] text-hud-magenta"
          >
            LIVE
          </Badge>
        </p>
        {isEmpty ? (
          <>
            {/* Heading font lacks dash glyphs — mono ASCII empty signal */}
            <p
              className="font-mono text-6xl font-black tracking-tight text-muted-foreground"
              aria-label="No RS logged"
            >
              --
            </p>
            <p className="text-sm text-muted-foreground">No RS logged yet.</p>
          </>
        ) : (
          <>
            <p className="font-heading text-6xl font-black tracking-tight text-foreground tabular-nums hud-glow-primary">
              {latest?.rs.toLocaleString()}
            </p>
            {seasonNet !== null && (
              <p className="font-sans text-sm text-primary">
                NET {formatSigned(seasonNet)}{" "}
                <span className="text-muted-foreground">· THIS SEASON</span>
              </p>
            )}
          </>
        )}
        <h2 className="font-heading text-sm tracking-[0.2em] text-hud-cyan">Season 11 (Current)</h2>
      </section>

      {!isEmpty && (
        <section aria-label="Season summary" className="mb-5 font-sans text-xs">
          <dl>
            <ProtoStatRow label="Latest RS" value={latest?.rs.toLocaleString() ?? "--"} />
            <ProtoStatRow label="Season net" value={formatSigned(seasonNet ?? 0)} accent />
          </dl>
        </section>
      )}

      <section aria-label="Entry timeline" className="mb-4 flex flex-col gap-3">
        <h3 className="font-heading text-xs tracking-[0.25em] text-hud-cyan">Entry timeline</h3>
        {isEmpty ? (
          <p className="text-muted-foreground">No Entries yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...entries].reverse().map((entry, index, list) => (
              <ProtoTimelineRow key={entry.id} entry={entry} previous={list[index + 1]} />
            ))}
          </ul>
        )}
      </section>

      <div className="mb-4 rounded-none border border-border bg-card/60 p-2 font-heading text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Season control · S11*
      </div>

      <div className={cn(dockCta && "mt-auto pt-2")}>{cta}</div>
    </main>
  );
}

function ProtoTimelineRow({
  entry,
  previous,
}: {
  entry: ProtoEntry;
  previous: ProtoEntry | undefined;
}) {
  const delta = previous !== undefined ? entry.rs - previous.rs : null;
  return (
    <li className="flex items-center justify-between gap-2 border border-border bg-card/80 px-3 py-2 font-sans text-sm">
      <div>
        <p className="text-primary">
          RS {entry.rs.toLocaleString()}
          {delta !== null && (
            <span className={cn("ml-2", delta < 0 ? "text-destructive" : "text-hud-cyan")}>
              {formatSigned(delta)}
            </span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground">{formatLocalWhen(entry.recordedAt)}</p>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Read-only
      </span>
    </li>
  );
}

function ProtoStatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", accent ? "text-primary" : "text-foreground")}>{value}</dd>
    </div>
  );
}

/** Bottom-docked visitor CTA (in flow — never overlays timeline / switcher). */
export function StickyTrackCta() {
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className="h-12 w-full rounded-none border border-primary bg-background font-heading text-sm font-bold uppercase tracking-[0.2em]"
    >
      Track your own RS
    </Button>
  );
}
