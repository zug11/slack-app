import { create } from "zustand";

type Status = "online" | "idle" | "dnd" | "offline" | "invisible";

interface PresenceState {
  presences: Record<string, Status>;
  setPresence: (userId: string, status: Status) => void;
  bulkSetPresences: (map: Record<string, Status>) => void;
  getStatus: (userId: string) => Status;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presences: {},
  setPresence: (userId, status) =>
    set((s) => ({
      presences: { ...s.presences, [userId]: status },
    })),
  bulkSetPresences: (map) =>
    set((s) => ({
      presences: { ...s.presences, ...map },
    })),
  getStatus: (userId) => get().presences[userId] || "offline",
}));
