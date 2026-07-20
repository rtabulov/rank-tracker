import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function TrackYourOwnRsButton() {
  return (
    <Button type="button" variant="outline" className="rounded-none bg-background" asChild>
      <Link to="/">Track your own RS</Link>
    </Button>
  );
}

export function TrackYourOwnRsInlineLink() {
  return (
    <Button type="button" variant="link" className="h-auto justify-start px-0" asChild>
      <Link to="/">Track your own RS →</Link>
    </Button>
  );
}
