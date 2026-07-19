import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  isCloudSyncAllowed as computeCloudSyncAllowed,
  type PlayerProfile,
  type ProfileClient,
  type SetDisplayNameResult,
} from "@/lib/profile";

type ProfileContextValue = {
  profile: PlayerProfile | null;
  status: "idle" | "loading" | "ready";
  profileClient: ProfileClient;
  isCloudSyncAllowed: boolean;
  saveDisplayName: (displayName: string) => Promise<SetDisplayNameResult>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  children,
  profileClient,
}: {
  children: ReactNode;
  profileClient: ProfileClient;
}) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");

  useEffect(() => {
    if (session === null) {
      setProfile(null);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    void profileClient.getProfile(session.userId).then((next) => {
      if (!cancelled) {
        setProfile(next);
        setStatus("ready");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profileClient, session]);

  const saveDisplayName = async (displayName: string): Promise<SetDisplayNameResult> => {
    if (session === null) {
      return { ok: false, error: "Sign in to choose a display name." };
    }

    const result = await profileClient.setDisplayName(session.userId, displayName);
    if (result.ok) {
      setProfile(result.profile);
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
