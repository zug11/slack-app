import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  role: string;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  slug: string | null;
  topic: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  lastMessageAt: Date | null;
  messageCount: number;
  lastReadAt: Date | null;
  isMuted: boolean;
  memberRole: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  conversations: [],
  currentConversation: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (currentConversation) => set({ currentConversation }),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}));
