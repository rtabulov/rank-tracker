import { useEffect } from "react";

import { cycleExplicitTheme, useTheme } from "@/components/theme-provider";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function ThemeHotkey() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "d" && event.key !== "D") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();

      const effectiveTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";

      setTheme(cycleExplicitTheme(theme, effectiveTheme));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [theme, setTheme]);

  return null;
}
