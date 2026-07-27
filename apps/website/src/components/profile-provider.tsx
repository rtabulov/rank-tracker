import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  isCloudSyncAllowed as computeCloudSyncAllowed,
  type PlayerProfile,
  type ProfileClient,
  type SetDisplayNameResult,
  type SetIsPublicResult,
} from "@/lib/profile";

type ProfileContextValue = {
  profile: PlayerProfile | null;
  status: "idle" | "loading" | "ready";
  profileClient: ProfileClient;
  isCloudSyncAllowed: boolean;
  saveDisplayName: (displayName: string) => Promise<SetDisplayNameResult>;
  setPublicSharing: (isPublic: boolean) => Promise<SetIsPublicResult>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

type LoadedProfile = {
  userId: string;
  profile: PlayerProfile | null;
};

export function ProfileProvider({
  children,
  profileClient,
}: {
  children: ReactNode;
  profileClient: ProfileClient;
}) {
  const { session } = useAuth();
  const sessionUserId = session?.userId ?? null;
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);

  useEffect(() => {
    if (sessionUserId === null) {
      setLoaded(null);
      return;
    }

    let cancelled = false;
    void profileClient.getProfile(sessionUserId).then((profile) => {
      if (!cancelled) {
        setLoaded({ userId: sessionUserId, profile });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profileClient, sessionUserId]);

  // Derive load status from the session, not a lagged effect flag — otherwise the
  // first paint after auth restores a session still has status "ready" + null
  // profile from the signed-out state and DisplayNameGate flashes.
  const status: "idle" | "loading" | "ready" =
    sessionUserId === null ? "ready" : loaded?.userId === sessionUserId ? "ready" : "loading";
  const profile = loaded?.userId === sessionUserId ? loaded.profile : null;

  const saveDisplayName = async (displayName: string): Promise<SetDisplayNameResult> => {
    if (session === null) {
      return { ok: false, error: "Sign in to choose a display name." };
    }

    const result = await profileClient.setDisplayName(session.userId, displayName);
    if (result.ok) {
      setLoaded({ userId: session.userId, profile: result.profile });
    }
    return result;
  };

  const setPublicSharing = async (isPublic: boolean): Promise<SetIsPublicResult> => {
    if (session === null) {
      return { ok: false, error: "Sign in to change Public sharing." };
    }

    const result = await profileClient.setIsPublic(session.userId, isPublic);
    if (result.ok) {
      setLoaded({ userId: session.userId, profile: result.profile });
    }
    return result;
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        status,
        profileClient,
        isCloudSyncAllowed: computeCloudSyncAllowed(session, profile),
        saveDisplayName,
        setPublicSharing,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (context === null) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
