import { bodyScanForRs } from "./body-scan.ts";
import { extractRsFromHttpJson, type HttpJsonFrame, type RsCarrier } from "./rs-carrier.ts";

export type TimestampedHttpJsonFrame = HttpJsonFrame & {
  capturedAt: string;
};

export type ExtractionOk = {
  ok: true;
  rs: number;
  source: "carrier" | "scan";
  carrierId?: string;
  field?: string;
};

export type ExtractionFail = {
  ok: false;
  reason: "no_match";
};

export type ExtractionResult = ExtractionOk | ExtractionFail;

type CarrierHit = {
  rs: number;
  carrierId: string;
  priority: number;
  capturedAt: string;
};

type ScanHit = {
  rs: number;
  field: string;
  capturedAt: string;
};

function collectCarrierAliases(carriers: readonly RsCarrier[]): string[] {
  const aliases: string[] = [];
  for (const carrier of carriers) {
    if (carrier.fieldAliases) {
      aliases.push(...carrier.fieldAliases);
    }
  }
  return aliases;
}

function bestCarrierHit(hits: readonly CarrierHit[]): CarrierHit | null {
  if (hits.length === 0) {
    return null;
  }
  return [...hits].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.capturedAt.localeCompare(a.capturedAt);
  })[0]!;
}

function bestScanHit(hits: readonly ScanHit[]): ScanHit | null {
  if (hits.length === 0) {
    return null;
  }
  return [...hits].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0]!;
}

/**
 * Layered RS extraction across captured frames.
 * Carrier matches win by priority, then frame recency; scan fallback only when qualified.
 */
export function extractBestRsFromFrames(
  frames: readonly TimestampedHttpJsonFrame[],
  carriers: readonly RsCarrier[],
  options: { qualifiedAttempt: boolean },
): ExtractionResult {
  const carrierHits: CarrierHit[] = [];
  const carrierById = new Map(carriers.map((carrier) => [carrier.id, carrier]));

  for (const frame of frames) {
    const extracted = extractRsFromHttpJson(frame, carriers);
    if (extracted.ok) {
      const carrier = carrierById.get(extracted.carrierId);
      carrierHits.push({
        rs: extracted.rs,
        carrierId: extracted.carrierId,
        priority: carrier?.priority ?? 0,
        capturedAt: frame.capturedAt,
      });
    }
  }

  const bestCarrier = bestCarrierHit(carrierHits);
  if (bestCarrier) {
    return {
      ok: true,
      rs: bestCarrier.rs,
      source: "carrier",
      carrierId: bestCarrier.carrierId,
    };
  }

  if (!options.qualifiedAttempt) {
    return { ok: false, reason: "no_match" };
  }

  const extraAliases = collectCarrierAliases(carriers);
  const scanHits: ScanHit[] = [];
  for (const frame of frames) {
    const scanned = bodyScanForRs({
      host: frame.host,
      body: frame.body,
      extraFieldAliases: extraAliases,
    });
    if (scanned.ok) {
      scanHits.push({
        rs: scanned.rs,
        field: scanned.field,
        capturedAt: frame.capturedAt,
      });
    }
  }

  const bestScan = bestScanHit(scanHits);
  if (bestScan) {
    return {
      ok: true,
      rs: bestScan.rs,
      source: "scan",
      field: bestScan.field,
    };
  }

  return { ok: false, reason: "no_match" };
}
