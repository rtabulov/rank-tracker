import type { LocalStore } from "./types.ts";

export function exportFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `rank-tracker-export-${year}-${month}-${day}.json`;
}

export function downloadExport(store: LocalStore): { ok: true } | { ok: false } {
  try {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFilename();
    anchor.click();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
