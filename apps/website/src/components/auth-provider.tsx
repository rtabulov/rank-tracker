import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthClient, AuthSession } from "@/lib/auth";

type AuthContextValue = {
  session: AuthSession | null;
  status: "loading" | "ready";
  authClient: AuthClient;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  authClient,
}: {
  children: ReactNode;
  authClient: AuthClient;
}) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = authClient.onAuthStateChange((next) => {
      if (!cancelled) {
        setSession(next);
        setStatus("ready");
      }
    });

    void authClient.getSession().then((next) => {
      if (!cancelled) {
        setSession(next);
        setStatus("ready");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authClient]);

  return (
    <AuthContext.Provider value={{ session, status, authClient }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
