import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PrototypeVariantMeta = {
  key: string;
  name: string;
};

type PrototypeSwitcherProps = {
  variants: PrototypeVariantMeta[];
  current: string;
  onChange: (key: string) => void;
};

/** PROTOTYPE ONLY — floating variant bar. Hidden outside DEV. */
export function PrototypeSwitcher({ variants, current, onChange }: PrototypeSwitcherProps) {
  if (!import.meta.env.DEV) {
    return null;
  }

  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current),
  );
  const active = variants[index] ?? variants[0];

  const cycle = (delta: number) => {
    if (variants.length === 0) {
      return;
    }
    const next = (index + delta + variants.length) % variants.length;
    const target = variants[next];
    if (target !== undefined) {
      onChange(target.key);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (variants.length === 0) {
        return;
      }
      const currentIndex = Math.max(
        0,
        variants.findIndex((variant) => variant.key === current),
      );
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        const next = (currentIndex + delta + variants.length) % variants.length;
        const target = variants[next];
        if (target !== undefined) {
          onChange(target.key);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, onChange, variants]);

  if (active === undefined) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Prototype variant"
      className={cn(
        "z-[100] flex items-center justify-center gap-2",
        "border-t-2 border-black bg-yellow-300 px-2 py-2 text-black",
        "font-sans text-xs font-bold",
      )}
    >
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-7 rounded-full text-black hover:bg-black/10"
        aria-label="Previous variant"
        onClick={() => cycle(-1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-40 rounded-full border-2 border-black bg-yellow-300 px-3 py-1 text-center tabular-nums">
        {active.key} — {active.name}
      </span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-7 rounded-full text-black hover:bg-black/10"
        aria-label="Next variant"
        onClick={() => cycle(1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
