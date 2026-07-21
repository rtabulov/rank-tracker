import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-none bg-muted/40 border border-border/40", className)}
      aria-hidden="true"
    />
  );
}

/** Season-view-shaped pending shell — global defaultPendingComponent. */
export function SeasonViewSkeleton({ showViewingStrip = false }: { showViewingStrip?: boolean }) {
  return (
    <main
      className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-4 pt-5"
      aria-busy="true"
      aria-label="Loading Season view"
    >
      {showViewingStrip ? (
        <div className="mb-2">
          <Bone className="h-8 w-full" />
        </div>
      ) : null}

      <section className="mb-5 flex flex-col gap-2" aria-hidden="true">
        <Bone className="h-3 w-24" />
        <Bone className="h-16 w-48" />
        <Bone className="h-4 w-40" />
      </section>

      <section className="mb-5" aria-hidden="true">
        <Bone className="h-24 w-full" />
      </section>

      <section className="mb-5 flex flex-col gap-2" aria-hidden="true">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-[90%]" />
        <Bone className="h-4 w-[70%]" />
        <Bone className="h-4 w-3/4" />
      </section>

      <section className="mb-4 flex flex-col gap-2" aria-hidden="true">
        <Bone className="h-3 w-32" />
        <Bone className="h-12 w-full" />
        <Bone className="h-12 w-full" />
        <Bone className="h-12 w-full" />
      </section>
    </main>
  );
}

export function PublicSeasonViewSkeleton() {
  return <SeasonViewSkeleton showViewingStrip />;
}
