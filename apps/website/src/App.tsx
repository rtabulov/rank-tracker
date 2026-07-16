import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <main className="flex min-h-svh flex-col gap-4 p-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-medium tracking-tight">Rank Tracker</h1>
          <ModeToggle />
        </header>
      </main>
    </ThemeProvider>
  );
}
