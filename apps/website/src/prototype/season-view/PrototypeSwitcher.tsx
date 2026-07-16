/** PROTOTYPE — floating variant bar; hide in production builds. */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type PrototypeVariantKey = "A" | "B" | "C";

const ORDER: PrototypeVariantKey[] = ["A", "B", "C"];

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: Record<PrototypeVariantKey, string>;
  current: PrototypeVariantKey;
}) {
  const navigate = useNavigate();

  function go(next: PrototypeVariantKey) {
    void navigate({
      to: "/prototype/season-view",
      search: { variant: next },
      replace: true,
    });
  }

  function step(delta: number) {
    const i = ORDER.indexOf(current);
    const next = ORDER[(i + delta + ORDER.length) % ORDER.length]!;
    go(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const delta = e.key === "ArrowLeft" ? -1 : 1;
      const i = ORDER.indexOf(current);
      const next = ORDER[(i + delta + ORDER.length) % ORDER.length]!;
      void navigate({
        to: "/prototype/season-view",
        search: { variant: next },
        replace: true,
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, navigate]);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 shadow-lg">
      <Button variant="ghost" size="icon-sm" aria-label="Previous variant" onClick={() => step(-1)}>
        ←
      </Button>
      <span className="min-w-44 text-center text-sm font-medium tabular-nums">
        {current} — {variants[current]}
      </span>
      <Button variant="ghost" size="icon-sm" aria-label="Next variant" onClick={() => step(1)}>
        →
      </Button>
    </div>
  );
}
