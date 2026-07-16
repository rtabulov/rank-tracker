/**
 * PROTOTYPE — three Season view layout variants, switchable via ?variant=
 * Question: What does the main screen look like?
 */

import { getRouteApi } from "@tanstack/react-router";
import { PrototypeSwitcher, type PrototypeVariantKey } from "./PrototypeSwitcher";
import { VariantA, VARIANT_A_NAME } from "./variant-a-chart-first";
import { VariantB, VARIANT_B_NAME } from "./variant-b-split-pane";
import { VariantC, VARIANT_C_NAME } from "./variant-c-hero-timeline";

const routeApi = getRouteApi("/prototype/season-view");

const NAMES: Record<PrototypeVariantKey, string> = {
  A: VARIANT_A_NAME,
  B: VARIANT_B_NAME,
  C: VARIANT_C_NAME,
};

export function SeasonViewPrototype() {
  const { variant } = routeApi.useSearch();

  return (
    <>
      <div className="border-b border-dashed border-amber-600/50 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-950 dark:text-amber-100">
        PROTOTYPE — Season view layouts. Flip variants with the bar below or ← → keys. Not
        production UI.
      </div>
      {variant === "A" ? <VariantA /> : null}
      {variant === "B" ? <VariantB /> : null}
      {variant === "C" ? <VariantC /> : null}
      <PrototypeSwitcher variants={NAMES} current={variant} />
    </>
  );
}

export function parseSeasonViewSearch(search: Record<string, unknown>): {
  variant: PrototypeVariantKey;
} {
  const v = search.variant;
  if (v === "B" || v === "C" || v === "A") return { variant: v };
  return { variant: "A" };
}
