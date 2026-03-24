"use client";

import { useEffect } from "react";
import { useSocket } from "./use-socket";
import { usePresenceStore } from "@/stores/presence-store";

export function usePresence(workspaceId: string) {
  const { socket } = useSocket();
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

  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (data: {
      userId: string;
      status: string;
    }) => {
      setPresence(data.userId, data.status as any);
    };

    socket.on("presence:update", handlePresenceUpdate);
    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [socket, setPresence]);
}
