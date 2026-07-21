import { useRouter } from "@tanstack/react-router";
import { PublicRouteMeta } from "@/components/public-route-meta";
import { TrackYourOwnRsButton } from "@/components/track-your-own-rs-link";
import { Button } from "@/components/ui/button";

export function PublicSeasonLoadError({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <>
      <PublicRouteMeta />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-start gap-3 px-4 pb-8 pt-10">
        <h2 className="font-heading text-xl font-bold tracking-[0.12em] text-foreground">
          Couldn’t load Public Season view
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Something went wrong while loading this Public link."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => {
              void router.invalidate();
            }}
          >
            Retry
          </Button>
          <TrackYourOwnRsButton />
        </div>
      </main>
    </>
  );
}
