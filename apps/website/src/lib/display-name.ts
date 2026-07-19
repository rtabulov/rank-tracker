const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

export function validateDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  if (trimmed.length < 3) {
    return "Display name must be at least 3 characters.";
  }
  if (trimmed.length > 24) {
    return "Display name must be at most 24 characters.";
  }
  if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
    return "Use letters, numbers, underscores, or hyphens only.";
  }
  return null;
}

export function normalizeDisplayName(displayName: string): string {
  return displayName.trim();
}
