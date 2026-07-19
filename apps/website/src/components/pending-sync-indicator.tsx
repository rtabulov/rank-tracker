import { CloudUpload } from "lucide-react";
import { useCloudSync } from "@/components/cloud-sync-provider";
import { useProfile } from "@/components/profile-provider";

export function PendingSyncIndicator() {
  const { pendingSyncCount } = useCloudSync();
  const { isCloudSyncAllowed } = useProfile();

  if (!isCloudSyncAllowed || pendingSyncCount === 0) {
    return null;
  }

  return (
    <p
      className="flex items-center gap-1 font-heading text-[10px] tracking-[0.2em] text-hud-amber"
      role="status"
      aria-label="Cloud sync pending"
    >
      <CloudUpload aria-hidden className="size-3 shrink-0" />
      Sync pending
    </p>
  );
}
