import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  activeNav: "home" | "dms" | "activity" | "later";
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveNav: (nav: "home" | "dms" | "activity" | "later") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeNav: "home",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveNav: (nav) => set({ activeNav: nav }),
}));
