import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

function OverlayChrome({
  title,
  onClose,
  Title,
}: {
  title: string;
  onClose: () => void;
  Title: typeof DialogTitle | typeof SheetTitle;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <Title className="text-lg font-medium">{title}</Title>
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}

export function ViewportOverlay({
  open,
  title,
  titleId: _titleId,
  onClose,
  children,
}: ViewportOverlayProps) {
  const isMobile = useIsMobileViewport();
  const variant = isMobile ? "drawer" : "dialog";

  if (!open) {
    return null;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  if (isMobile) {
    return (
      <Sheet open onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          data-overlay-variant={variant}
          className="max-w-lg gap-4 rounded-t-xl border border-border bg-background p-6"
        >
          <SheetHeader className="p-0">
            <OverlayChrome title={title} onClose={onClose} Title={SheetTitle} />
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-overlay-variant={variant}
        className="max-w-md gap-4 rounded-xl border border-border bg-background p-6 shadow-lg sm:max-w-md"
      >
        <DialogHeader className="gap-0">
          <OverlayChrome title={title} onClose={onClose} Title={DialogTitle} />
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
