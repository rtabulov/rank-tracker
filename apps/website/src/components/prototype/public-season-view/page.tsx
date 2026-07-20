/**
 * PROTOTYPE — throwaway.
 *
 * Public link controls + Public Season view chrome. Locked hybrid is `?variant=W`
 * (Settings/Unavailable from A, Populated/Empty from B). A/B/C remain for comparison.
 * Route: `/prototype/public-season-view`.
 */
import { useNavigate, useSearch } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isProtoScreen, PROTO_SCREENS, type ProtoScreen } from "./mock-data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";
import { VariantWinner } from "./variant-winner";

const VARIANTS = [
  { key: "W", name: "Locked hybrid" },
  { key: "A", name: "Compact inline" },
  { key: "B", name: "Expandable panel" },
  { key: "C", name: "Identity-forward" },
] as const;

type VariantKey = (typeof VARIANTS)[number]["key"];

function isVariantKey(value: string): value is VariantKey {
  return VARIANTS.some((variant) => variant.key === value);
}

export type PublicSeasonViewPrototypeSearch = {
  variant?: string;
  screen?: string;
};

export function PublicSeasonViewPrototypePage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as PublicSeasonViewPrototypeSearch;

  const rawVariant = search.variant ?? "";
  const rawScreen = search.screen ?? "";
  const variant: VariantKey = isVariantKey(rawVariant) ? rawVariant : "W";
  const screen: ProtoScreen = isProtoScreen(rawScreen) ? rawScreen : "settings";

  const setSearch = (next: { variant?: VariantKey; screen?: ProtoScreen }) => {
    void navigate({
      to: "/prototype/public-season-view",
      search: {
        variant: next.variant ?? variant,
        screen: next.screen ?? screen,
      },
      replace: true,
    });
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      {/* Prototype chrome — in flow so it never covers the design under test */}
      <div
        role="toolbar"
        aria-label="Prototype screen"
        className="shrink-0 border-b-2 border-black bg-yellow-300 px-2 py-2"
      >
        <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-1">
          {PROTO_SCREENS.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="xs"
              variant={screen === item.key ? "default" : "outline"}
              className={cn(
                "rounded-full border-2 border-black font-sans text-[10px] font-bold",
                screen === item.key
                  ? "bg-black text-yellow-300 hover:bg-black/90"
                  : "bg-yellow-100 text-black hover:bg-yellow-50",
              )}
              onClick={() => setSearch({ screen: item.key })}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {variant === "W" && <VariantWinner screen={screen} />}
        {variant === "A" && <VariantA screen={screen} />}
        {variant === "B" && <VariantB screen={screen} />}
        {variant === "C" && <VariantC screen={screen} />}
      </div>

      <div className="shrink-0">
        <PrototypeSwitcher
          variants={[...VARIANTS]}
          current={variant}
          onChange={(key) => {
            if (isVariantKey(key)) {
              setSearch({ variant: key });
            }
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        Prototype state: variant {variant}, screen {screen}
      </p>
    </div>
  );
}
