import { useEffect, useState } from "react";

/** Open on the next macrotask so Radix Presence sees a closed→open transition. */
export function useDeferredOpen(open: boolean): boolean {
  const [deferredOpen, setDeferredOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setDeferredOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setDeferredOpen(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  return deferredOpen;
}
