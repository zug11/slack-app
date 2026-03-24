import { create } from "zustand";

interface ThreadState {
  openThreadId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
}

export const useThreadStore = create<ThreadState>((set) => ({
  openThreadId: null,
  openThread: (messageId) => set({ openThreadId: messageId }),
  closeThread: () => set({ openThreadId: null }),
}));
