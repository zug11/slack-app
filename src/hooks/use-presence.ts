"use client";

import { useEffect } from "react";
import { useRealtimeTable } from "./use-realtime";
import { usePresenceStore } from "@/stores/presence-store";

export function usePresence(workspaceId: string) {
  const { setPresence, bulkSetPresences } = usePresenceStore();

  // Fetch initial presences
  useEffect(() => {
    async function fetchPresences() {
      try {
        const res = await fetch(`/api/presence?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, any> = {};
          for (const p of data.presences) {
            map[p.userId] = p.status;
          }
          bulkSetPresences(map);
        }
      } catch {}
    }
    fetchPresences();
  }, [workspaceId, bulkSetPresences]);

  // Subscribe to real-time presence updates via Supabase
  useRealtimeTable(
    "user_presences",
    { column: "workspace_id", value: workspaceId },
    (newRecord) => {
      setPresence(newRecord.user_id, newRecord.status);
    },
    (updated) => {
      setPresence(updated.user_id, updated.status);
    }
  );
}
