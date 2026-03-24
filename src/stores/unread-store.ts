import { create } from "zustand";

interface UnreadState {
  unreads: Record<string, number>;
  setUnreads: (unreads: Record<string, number>) => void;
  setUnread: (channelId: string, count: number) => void;
  incrementUnread: (channelId: string) => void;
  clearUnread: (channelId: string) => void;
  getTotalUnread: () => number;
}

export const useUnreadStore = create<UnreadState>((set, get) => ({
  unreads: {},
  setUnreads: (unreads) => set({ unreads }),
  setUnread: (channelId, count) =>
    set((s) => ({ unreads: { ...s.unreads, [channelId]: count } })),
  incrementUnread: (channelId) =>
    set((s) => ({
      unreads: {
        ...s.unreads,
        [channelId]: (s.unreads[channelId] || 0) + 1,
      },
    })),
  clearUnread: (channelId) =>
    set((s) => ({ unreads: { ...s.unreads, [channelId]: 0 } })),
  getTotalUnread: () =>
    Object.values(get().unreads).reduce((sum, n) => sum + n, 0),
}));
