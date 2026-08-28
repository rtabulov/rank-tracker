import type { Phase } from "./machine.ts";

export type CaptureDebugInput = {
  companionVersion: string;
  phase: Phase;
  manifestStale: boolean;
  manifestWarnings: readonly string[];
  carrierIds: readonly string[];
  frameCount: number;
  sawDiscoveryTraffic: boolean;
  keylogPresent: boolean;
};

/** Sanitized debug bundle for support — no PII, tokens, or raw traffic. */
export function buildCaptureDebugInfo(input: CaptureDebugInput): string {
  const lines = [
    `companionVersion=${input.companionVersion}`,
    `phase=${input.phase}`,
    `manifestStale=${input.manifestStale}`,
    `manifestWarnings=${input.manifestWarnings.join(" | ") || "none"}`,
    `carrierIds=${input.carrierIds.join(",") || "none"}`,
    `frameCount=${input.frameCount}`,
    `sawDiscoveryTraffic=${input.sawDiscoveryTraffic}`,
    `keylogPresent=${input.keylogPresent}`,
  ];
  return lines.join("\n");
}
