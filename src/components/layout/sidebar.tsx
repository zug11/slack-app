"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  ListFilter,
  SquarePen,
} from "lucide-react";
import { useUnreadStore } from "@/stores/unread-store";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface Conversation {
  id: string;
  type: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  isArchived: boolean;
  lastMessageAt: Date | null;
}

export function Sidebar({
  workspace,
  conversations,
  onSearchClick,
}: {
  workspace: Workspace;
  conversations: Conversation[];
  onSearchClick?: () => void;
}) {
  const pathname = usePathname();
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const unreads = useUnreadStore((s) => s.unreads);
  const setUnreads = useUnreadStore((s) => s.setUnreads);

  // Fetch unread counts
  useEffect(() => {
    async function fetchUnreads() {
      try {
        const res = await fetch(`/api/unread?workspaceId=${workspace.id}`);
        if (res.ok) {
          const data = await res.json();
          setUnreads(data.unreads);
        }
      } catch {}
    }
    fetchUnreads();
  }, [workspace.id, setUnreads]);

  return (
    <>
      <aside className="w-[250px] bg-[#3f0e40] text-[#cfc3cf] flex flex-col h-full">
        {/* Workspace header */}
        <div className="h-[49px] flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <h1 className="font-bold text-white text-[17px] truncate">
              {workspace.name}
            </h1>
            <ChevronDown size={16} className="text-white/60 shrink-0" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <ListFilter size={16} />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <SquarePen size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-3 space-y-4">
          {/* Search */}
          <button
            onClick={onSearchClick}
            className="relative w-full px-1"
          >
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <div className="w-full bg-white/10 border border-white/5 rounded-md py-1.5 pl-8 pr-3 text-sm text-white/40 text-left hover:bg-white/15 transition-all cursor-pointer">
              Search {workspace.name}
            </div>
          </button>

          {/* Channels section */}
          <div>
            <button
              onClick={() => setChannelsOpen(!channelsOpen)}
              className="flex items-center justify-between w-full px-2 py-1 group/section hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1">
                {channelsOpen ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-[#b5a8b5] group-hover/section:text-white transition-colors">
                  Channels
                </span>
              </div>
              <Plus
                size={14}
                className="text-[#b5a8b5] opacity-0 group-hover/section:opacity-100 transition-all hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateChannel(true);
                }}
              />
            </button>

            {channelsOpen && (
              <div className="mt-0.5 space-y-px">
                {conversations.map((conv) => {
                  const isActive = pathname.includes(conv.id);
                  const unreadCount = unreads[conv.id] || 0;
                  return (
                    <Link
                      key={conv.id}
                      href={`/${workspace.slug}/${conv.id}`}
                      className={`flex items-center justify-between px-2 py-[5px] rounded-md text-[14px] transition-colors ${
                        isActive
                          ? "bg-[#1164a3] text-white font-medium"
                          : unreadCount > 0
                            ? "text-white font-semibold hover:bg-[#350d36]"
                            : "text-[#cfc3cf] hover:bg-[#350d36] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {conv.isPrivate ? (
                          <Lock size={14} className="shrink-0 opacity-70" />
                        ) : (
                          <Hash size={14} className="shrink-0 opacity-70" />
                        )}
                        <span className="truncate">{conv.name}</span>
                      </div>
                      {unreadCount > 0 && !isActive && (
                        <span className="bg-[#e01e5a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="flex items-center gap-2 px-2 py-[5px] rounded-md text-[14px] text-[#b5a8b5] hover:bg-[#350d36] hover:text-white transition-colors w-full"
                >
                  <Plus size={14} className="opacity-70" />
                  <span>Add channels</span>
                </button>
              </div>
            )}
          </div>

          {/* Direct Messages section */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 group/section">
              <div className="flex items-center gap-1">
                <ChevronDown size={12} />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#b5a8b5]">
                  Direct Messages
                </span>
              </div>
              <Plus
                size={14}
                className="text-[#b5a8b5] opacity-0 group-hover/section:opacity-100 transition-all hover:text-white cursor-pointer"
              />
            </div>
            <div className="mt-0.5 px-2 py-1 text-xs text-white/30">
              Start a conversation
            </div>
          </div>
        </div>
      </aside>

      {showCreateChannel && (
        <CreateChannelModal
          workspaceId={workspace.id}
          workspaceSlug={workspace.slug}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
    </>
  );
}
