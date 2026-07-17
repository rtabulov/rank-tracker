import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const MOBILE_QUERY = "(max-width: 640px)";

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window.matchMedia === "function" ? window.matchMedia(MOBILE_QUERY).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      setIsMobile(media.matches);
    };
    onChange();
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  return isMobile;
}

type ViewportOverlayProps = {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

export function ViewportOverlay({ open, title, titleId, onClose, children }: ViewportOverlayProps) {
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const variant = isMobile ? "drawer" : "dialog";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-overlay-variant={variant}
        className={
          isMobile
            ? "relative z-10 flex w-full max-w-lg flex-col gap-4 rounded-t-xl border border-border bg-background p-6"
            : "relative z-10 flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-lg"
        }
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-medium">
            {title}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
