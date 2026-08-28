import type { ExtractionResult } from "./rs-extraction.ts";
import type { Phase } from "./machine.ts";

export type QualifiedCaptureContext = {
  sawDiscoveryTraffic: boolean;
  keylogNonEmpty: boolean;
  phaseAtTimeout: Phase;
};

export function isQualifiedCaptureAttempt(context: QualifiedCaptureContext): boolean {
  return (
    context.sawDiscoveryTraffic && context.keylogNonEmpty && context.phaseAtTimeout === "capturing"
  );
}

export function shouldReportCaptureBroken(
  qualified: boolean,
  extraction: ExtractionResult,
): boolean {
  return qualified && !extraction.ok;
}
