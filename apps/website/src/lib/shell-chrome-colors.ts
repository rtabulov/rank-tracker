export const SHELL_BACKGROUND_LIGHT = "#f4f4f8";
export const SHELL_BACKGROUND_DARK = "#0a0a0f";

export type EffectiveTheme = "light" | "dark";

export function shellBackgroundForEffectiveTheme(theme: EffectiveTheme): string {
  return theme === "dark" ? SHELL_BACKGROUND_DARK : SHELL_BACKGROUND_LIGHT;
}

export function syncThemeColorMeta(effectiveTheme: EffectiveTheme): void {
  const content = shellBackgroundForEffectiveTheme(effectiveTheme);
  let meta = document.querySelector('meta[name="theme-color"][data-shell-chrome]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("data-shell-chrome", "");
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}
