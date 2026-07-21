import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-start gap-3 px-4 pb-8 pt-10">
      <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-hud-magenta">404</p>
      <h2 className="font-heading text-xl font-bold tracking-[0.12em] text-foreground">
        Page not found
      </h2>
      <p className="text-sm text-muted-foreground">That path isn’t in Rank Tracker.</p>
      <Button type="button" variant="outline" className="rounded-none bg-background" asChild>
        <Link to="/">Back to Season view</Link>
      </Button>
    </main>
  );
}
