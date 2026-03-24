"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { useThreadStore } from "@/stores/thread-store";
import { useUIStore } from "@/stores/ui-store";
import { MessageItem } from "./message-item";
import { MessageComposer } from "./message-composer";
import { TypingIndicator } from "@/components/presence/typing-indicator";
import {
  Hash,
  Lock,
  Users,
  Pin,
  Search,
  Menu,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string | null;
  type: string;
  threadId: string | null;
  replyCount: number;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  topic: string | null;
  description: string | null;
  isPrivate: boolean;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

function shouldShowDateDivider(
  current: string,
  previous: string | null
): boolean {
  if (!previous) return true;
  const d1 = new Date(current).toDateString();
  const d2 = new Date(previous).toDateString();
  return d1 !== d2;
}

export function ConversationView({
  channel,
  workspace,
}: {
  channel: Channel;
  workspace: Workspace;
}) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const fetchMessages = useCallback(
    async (loadMore = false) => {
      const params = new URLSearchParams({
        channelId: channel.id,
        limit: "50",
      });
      if (loadMore && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/messages?${params}`);
      const data = await res.json();

      if (loadMore) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.hasMore);
      setCursor(data.cursor);
      setLoading(false);
    },
    [channel.id, cursor]
  );

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setCursor(null);
    setShouldScrollToBottom(true);
    fetchMessages();
  }, [channel.id]);

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldScrollToBottom]);

  // Supabase Realtime — subscribe to message changes for this channel
  useRealtimeTable(
    "messages",
    { column: "channel_id", value: channel.id },
    // onInsert
    (newMsg) => {
      if (!newMsg.thread_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          // Fetch user info for the new message
          fetch(`/api/messages?channelId=${channel.id}&limit=1`)
            .then((r) => r.json())
            .then((data) => {
              if (data.messages?.length > 0) {
                const latest = data.messages[data.messages.length - 1];
                setMessages((p) => {
                  if (p.some((m) => m.id === latest.id)) return p;
                  return [...p, latest];
                });
              }
            });
          return prev;
        });
        setShouldScrollToBottom(true);
      }
    },
    // onUpdate
    (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
      );
    },
    // onDelete
    (old) => {
      setMessages((prev) => prev.filter((m) => m.id !== old.id));
    }
  );

  function handleScroll() {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 100 && hasMore && !loading) {
      setShouldScrollToBottom(false);
      fetchMessages(true);
    }
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setShouldScrollToBottom(isNearBottom);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Header */}
      <header className="h-[49px] flex items-center justify-between px-4 border-b border-[#e0e0e0] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded hover:bg-gray-100 text-[#616061] mr-1"
            onClick={toggleSidebar}
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            {channel.isPrivate ? (
              <Lock size={16} className="text-[#616061] shrink-0" />
            ) : (
              <Hash size={16} className="text-[#616061] shrink-0" />
            )}
            <h2 className="font-bold text-[#1d1c1d] text-[17px] truncate">
              {channel.name}
            </h2>
          </div>
          {channel.topic && (
            <>
              <div className="w-px h-4 bg-[#e0e0e0] mx-2 hidden sm:block" />
              <span className="text-[13px] text-[#616061] truncate hidden sm:block">
                {channel.topic}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-[#616061] shrink-0">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
            <Users size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
            <Pin size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Search size={16} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto main-scroll"
      >
        {hasMore && (
          <div className="text-center py-3">
            <button
              onClick={() => fetchMessages(true)}
              className="text-[13px] text-[#1264a3] hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#616061] text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-start px-5 pt-16 pb-4">
            <div className="w-12 h-12 rounded-lg bg-[#f0f4f8] flex items-center justify-center mb-3">
              <Hash size={24} className="text-[#616061]" />
            </div>
            <h3 className="text-[22px] font-bold text-[#1d1c1d] mb-1">
              Welcome to #{channel.name}
            </h3>
            {channel.description && (
              <p className="text-[15px] text-[#616061]">
                {channel.description}
              </p>
            )}
            <p className="text-[15px] text-[#616061] mt-1">
              This is the very beginning of the{" "}
              <strong>#{channel.name}</strong> channel.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg, i) => {
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showDivider = shouldShowDateDivider(
                msg.createdAt,
                prevMsg?.createdAt || null
              );

              return (
                <div key={msg.id}>
                  {showDivider && (
                    <div className="flex items-center gap-4 my-4 px-5">
                      <div className="h-px bg-[#e0e0e0] flex-1" />
                      <span className="text-[13px] font-medium text-[#616061] bg-white px-3 py-1 rounded-full border border-[#e0e0e0]">
                        {formatDateDivider(msg.createdAt)}
                      </span>
                      <div className="h-px bg-[#e0e0e0] flex-1" />
                    </div>
                  )}
                  <MessageItem message={msg} workspaceId={workspace.id} />
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <TypingIndicator conversationId={channel.id} />

      <MessageComposer
        channelId={channel.id}
        workspaceId={workspace.id}
        channelName={channel.name}
        onMessageSent={(msg) => {
          if (msg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setShouldScrollToBottom(true);
          }
        }}
      />
    </div>
  );
}
