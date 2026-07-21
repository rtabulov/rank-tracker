import { type ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useHydrated,
  useRouter,
} from "@tanstack/react-router";
import { DisplayNameGate } from "@/components/display-name-gate";
import { HeaderActions } from "@/components/header-actions";
import { HeaderEyebrow } from "@/components/header-eyebrow";
import { ThemeHotkey } from "@/components/theme-hotkey";
import { ThemeProvider } from "@/components/theme-provider";
import type { AppRouterContext } from "@/lib/router-context";
import { staticDocumentHead } from "@/lib/static-document";
// Global styles must live on a route module so Start's SSR style collector
// can emit them in the document head. Importing only from client.tsx left
// `/@tanstack-start/styles.css` empty and caused a white unstyled flash.
import "@/index.css";

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => staticDocumentHead(),
  component: RootComponent,
});

function RootComponent() {
  // In tests (jsdom) the app is mounted into an existing document via
  // `render()`, so wrapping in `<html>/<body>` produces invalid HTML nesting
  // and causes user-event pointer flows to hang. `client.tsx` still hydrates
  // the full document in production, so the wrapper is only needed there.
  if (import.meta.env.MODE === "test") {
    return <AppShell />;
  }
  return (
    <RootDocument>
      <AppShell />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // Theme boot script (and some extensions) set classes on <html> before
    // React hydrates; suppress so that intentional mismatch does not bail.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  // SPA shell SSR renders with isShell(); the client hydrates with isShell
  // false. Gate interactive chrome on useHydrated so the first client paint
  // still matches the shell HTML (eyebrow placeholder, no actions/gate).
  const hydrated = useHydrated();
  const isShell = useRouter().isShell();
  const showInteractiveChrome = hydrated && !isShell;

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ThemeHotkey />
      <div className="relative flex min-h-svh flex-col bg-background text-foreground">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] hud-scanlines"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--hud-cyan)_12%,transparent),transparent_55%)]"
          aria-hidden="true"
        />
        <header className="relative z-10 mx-auto w-full max-w-lg px-4 pt-4">
          <div className="hud-chamfer flex items-start justify-between gap-3 border border-primary/30 bg-card/80 p-3">
            <div>
              {showInteractiveChrome ? (
                <HeaderEyebrow />
              ) : (
                <p className="font-heading text-[10px] tracking-[0.35em] text-hud-cyan">
                  Rank Tracker
                </p>
              )}
              <h1 className="font-heading text-lg font-black uppercase tracking-[0.2em] text-primary hud-glow-primary">
                Rank Tracker
              </h1>
            </div>
            {showInteractiveChrome ? <HeaderActions /> : null}
          </div>
        </header>
        {showInteractiveChrome ? <DisplayNameGate /> : null}
        <div className="relative z-10 flex flex-1 flex-col">
          <Outlet />
        </div>
        <footer className="relative z-0 mx-auto w-full max-w-lg px-4 pb-28 pt-2">
          <nav
            aria-label="Project links"
            className="flex items-center justify-center gap-3 font-sans text-xs text-muted-foreground"
          >
            <a
              href="https://github.com/rtabulov/rank-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Source
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://github.com/rtabulov/rank-tracker/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Report a problem
            </a>
          </nav>
        </footer>
      </div>
    </ThemeProvider>
  );
}
