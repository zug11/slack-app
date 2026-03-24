"use client";

import { useEffect, useState, useRef } from "react";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { useThreadStore } from "@/stores/thread-store";
import { MessageItem } from "@/components/messages/message-item";
import { MessageComposer } from "@/components/messages/message-composer";
import { X, Hash } from "lucide-react";

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
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export function ThreadPanel() {
  const { openThreadId, closeThread } = useThreadStore();
  const [replies, setReplies] = useState<Message[]>([]);
  const [channelId, setChannelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openThreadId) return;

    async function fetchThread() {
      setLoading(true);
      const res = await fetch(
        `/api/messages/${openThreadId}/thread?limit=100`
      );
      const data = await res.json();

      if (data.messages?.length > 0) {
        setReplies(data.messages);
        setChannelId(data.messages[0].channelId);
      } else {
        setReplies([]);
      }
      setLoading(false);
    }

    fetchThread();
  }, [openThreadId]);

  // Supabase Realtime for thread replies
  useRealtimeTable(
    "messages",
    { column: "thread_id", value: openThreadId || "" },
    (newMsg) => {
      // Re-fetch to get user info
      if (openThreadId) {
        fetch(`/api/messages/${openThreadId}/thread?limit=100`)
          .then((r) => r.json())
          .then((data) => {
            if (data.messages) {
              setReplies(data.messages);
              setChannelId(data.messages[0]?.channelId || "");
            }
          });
      }
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  );

  if (!openThreadId) return null;

  return (
    <div className="w-[420px] border-l border-[#e0e0e0] flex flex-col bg-white shrink-0">
      {/* Header */}
      <div className="h-[49px] flex items-center justify-between px-4 border-b border-[#e0e0e0] shrink-0">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-[#616061]" />
          <h3 className="font-bold text-[#1d1c1d] text-[15px]">Thread</h3>
        </div>
        <button
          onClick={closeThread}
          className="p-1.5 rounded hover:bg-gray-100 text-[#616061] hover:text-[#1d1c1d] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto main-scroll">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#616061] text-sm">
            Loading thread...
          </div>
        ) : (
          <div className="py-2">
            {replies.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            {replies.length === 0 && (
              <div className="text-center text-[#616061] text-sm py-12">
                No replies yet. Start the conversation!
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply composer */}
      {channelId && (
        <MessageComposer
          channelId={channelId}
          threadId={openThreadId}
          placeholder="Reply..."
          onMessageSent={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        />
      )}
    </div>
  );
}
