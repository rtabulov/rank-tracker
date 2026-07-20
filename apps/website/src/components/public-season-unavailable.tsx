import { TrackYourOwnRsButton } from "@/components/track-your-own-rs-link";

export function PublicSeasonUnavailable() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-start gap-3 px-4 pb-8 pt-10">
      <h2 className="font-heading text-xl font-bold tracking-[0.12em] text-foreground">
        Public Season view unavailable
      </h2>
      <p className="text-sm text-muted-foreground">This Public link isn’t available.</p>
      <TrackYourOwnRsButton />
    </main>
  );
}
