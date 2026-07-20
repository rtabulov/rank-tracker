import type { ProtoScreen } from "./mock-data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";

/**
 * Locked hybrid from HITL:
 * Settings + Unavailable → A (compact inline / shell unavailable)
 * Populated + Empty → B (VIEWING strip + inline Track your own RS)
 */
export function VariantWinner({ screen }: { screen: ProtoScreen }) {
  if (screen === "settings" || screen === "unavailable") {
    return <VariantA screen={screen} />;
  }
  return <VariantB screen={screen} />;
}

VariantWinner.displayName = "Locked hybrid";
