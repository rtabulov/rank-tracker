import { SHELL_BACKGROUND_DARK, SHELL_BACKGROUND_LIGHT } from "@/lib/shell-chrome-colors";

export const SITE_TITLE = "Rank Tracker";
export const SITE_DESCRIPTION = "Personal Rank Score history for The Finals ranked play.";
export const PRODUCTION_URL = "https://rank.rtabulov.dev/";
export const PRODUCTION_OG_IMAGE_URL = "https://rank.rtabulov.dev/og.png";

/**
 * Critical first-paint background so the shell is never a white flash while
 * the full stylesheet (Tailwind + fonts) is still downloading.
 */
export const SHELL_CRITICAL_CSS = `html,body{background-color:${SHELL_BACKGROUND_LIGHT}}html.dark,html.dark body{background-color:${SHELL_BACKGROUND_DARK}}`;

/** Inline boot script: resolve theme class + sync theme-color before paint. */
export const THEME_BOOT_SCRIPT = `try {
  const storageKey = "vite-ui-theme";
  const stored = localStorage.getItem(storageKey);
  const theme =
    stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.add(resolved);
  let themeColorMeta = document.querySelector('meta[name="theme-color"][data-shell-chrome]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement("meta");
    themeColorMeta.setAttribute("name", "theme-color");
    themeColorMeta.setAttribute("data-shell-chrome", "");
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.setAttribute("content", resolved === "dark" ? "${SHELL_BACKGROUND_DARK}" : "${SHELL_BACKGROUND_LIGHT}");
} catch (_) {}`;

export function staticDocumentHead() {
  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PRODUCTION_URL },
      { property: "og:image", content: PRODUCTION_OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: PRODUCTION_OG_IMAGE_URL },
      {
        name: "theme-color",
        content: SHELL_BACKGROUND_LIGHT,
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: SHELL_BACKGROUND_DARK,
        media: "(prefers-color-scheme: dark)",
      },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    styles: [{ children: SHELL_CRITICAL_CSS }],
    scripts: [{ children: THEME_BOOT_SCRIPT }],
    title: SITE_TITLE,
  };
}
