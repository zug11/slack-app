"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { usePresence } from "@/hooks/use-presence";
import { IconSidebar } from "./icon-sidebar";
import { Sidebar } from "./sidebar";
import { ThreadPanel } from "@/components/threads/thread-panel";
import { SearchModal } from "@/components/search/search-modal";
import { useThreadStore } from "@/stores/thread-store";
import { useUIStore } from "@/stores/ui-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useUnreadStore } from "@/stores/unread-store";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  topic: string | null;
  isPrivate: boolean;
  isArchived: boolean;
  lastMessageAt: Date | null;
  lastReadAt: Date | null;
  isMuted: boolean;
  memberRole: string;
}

export function AppShell({
  workspace,
  conversations,
  children,
}: {
  workspace: Workspace;
  conversations: Channel[];
  children: React.ReactNode;
}) {
  const { socket } = useSocket();
  const openThreadId = useThreadStore((s) => s.openThreadId);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const [showSearch, setShowSearch] = useState(false);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const incrementUnread = useUnreadStore((s) => s.incrementUnread);

  // Initialize presence tracking
  usePresence(workspace.id);

  // Cmd+K shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Socket subscriptions for notifications and unread
  useEffect(() => {
    if (!socket) return;

    socket.emit("join-workspace", workspace.id);

    const handleNotification = (notif: any) => {
      addNotification(notif);
    };

    // Increment unread for messages in channels user isn't viewing
    const handleNewMessage = (msg: any) => {
      if (msg.channelId && !window.location.pathname.includes(msg.channelId)) {
        incrementUnread(msg.channelId);
      }
    };

    socket.on("notification:new", handleNotification);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, workspace.id, addNotification, incrementUnread]);

  return (
    <div className="h-screen flex overflow-hidden bg-[#1a0321]">
      {/* Icon rail */}
      <div className="hidden md:flex">
        <IconSidebar
          workspaceName={workspace.name}
          workspaceSlug={workspace.slug}
        />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Channel sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 md:z-auto transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          workspace={workspace}
          conversations={conversations}
          onSearchClick={() => setShowSearch(true)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex min-w-0 bg-white rounded-tl-lg overflow-hidden">
        {children}
      </main>

      {/* Thread panel */}
      {openThreadId && <ThreadPanel />}

      {/* Search modal */}
      {showSearch && (
        <SearchModal
          workspaceId={workspace.id}
          workspaceSlug={workspace.slug}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
