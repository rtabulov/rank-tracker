import { APP_SCHEMA_VERSION } from "./export.ts";
import type { Entry, LocalStore } from "./types.ts";

export type ImportErrorCategory = "invalid-json" | "wrong-shape" | "unsupported-version";

const ERROR_MESSAGES: Record<ImportErrorCategory, string> = {
  "invalid-json": "Invalid JSON.",
  "wrong-shape": "Wrong file shape.",
  "unsupported-version": "Unsupported version.",
};

export type ImportValidationResult =
  | { ok: true; store: LocalStore }
  | { ok: false; category: ImportErrorCategory; message: string };

function isValidEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.rs === "number" &&
    Number.isInteger(candidate.rs) &&
    candidate.rs >= 0 &&
    typeof candidate.recordedAt === "string" &&
    candidate.recordedAt.length > 0
  );
}

function normalizeEntry(entry: Entry): Entry {
  return {
    id: entry.id,
    rs: entry.rs,
    recordedAt: entry.recordedAt,
  };
}

function migrateToCurrentVersion(document: { version: number; entries: Entry[] }): LocalStore {
  let current = document;

  while (current.version < APP_SCHEMA_VERSION) {
    // v1 ships with an empty migration table.
    current = { version: current.version + 1, entries: current.entries };
  }

  return { version: APP_SCHEMA_VERSION, entries: current.entries.map(normalizeEntry) };
}

export function validateImportDocument(raw: string): ImportValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, category: "invalid-json", message: ERROR_MESSAGES["invalid-json"] };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, category: "wrong-shape", message: ERROR_MESSAGES["wrong-shape"] };
  }

  const document = parsed as Record<string, unknown>;
  if (typeof document.version !== "number" || !Array.isArray(document.entries)) {
    return { ok: false, category: "wrong-shape", message: ERROR_MESSAGES["wrong-shape"] };
  }

  if (document.version > APP_SCHEMA_VERSION) {
    return {
      ok: false,
      category: "unsupported-version",
      message: ERROR_MESSAGES["unsupported-version"],
    };
  }

  const entries: Entry[] = [];
  const seenIds = new Set<string>();

  for (const item of document.entries) {
    if (!isValidEntry(item)) {
      return { ok: false, category: "wrong-shape", message: ERROR_MESSAGES["wrong-shape"] };
    }

    if (seenIds.has(item.id)) {
      return { ok: false, category: "wrong-shape", message: ERROR_MESSAGES["wrong-shape"] };
    }

    seenIds.add(item.id);
    entries.push(normalizeEntry(item));
  }

  return {
    ok: true,
    store: migrateToCurrentVersion({ version: document.version, entries }),
  };
}
