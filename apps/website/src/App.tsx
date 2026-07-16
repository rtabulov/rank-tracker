import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  type AnyRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { ExampleNameForm } from "@/components/example-name-form";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const PAGES_BASEPATH = "/rank-tracker";

export function createAppRouter(options?: { history?: RouterHistory }) {
  return createRouter({
    routeTree,
    basepath: PAGES_BASEPATH,
    history: options?.history,
  });
}

const defaultRouter = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof defaultRouter;
  }
}

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between gap-4 p-6">
          <h1 className="text-2xl font-medium tracking-tight">Rank Tracker</h1>
          <ModeToggle />
        </header>
        <Outlet />
      </div>
    </ThemeProvider>
  );
}

function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-6 pb-6">
      <ExampleNameForm />
    </main>
  );
}

export function App({ router = defaultRouter }: { router?: AnyRouter }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
