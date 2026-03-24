"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Smile, Paperclip } from "lucide-react";

interface DMMessage {
  id: string;
  dmChannelId: string;
  userId: string;
  content: string | null;
  type: string;
  isEdited: boolean;
  createdAt: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface DMChannel {
  id: string;
  displayName: string;
  members: Array<{
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  }>;
}

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

export function DMConversationView({ channel }: { channel: DMChannel }) {
  const { socket } = useSocket();
  const user = useCurrentUser();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(
    async (loadMore = false) => {
      const params = new URLSearchParams({ limit: "50" });
      if (loadMore && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/dm/${channel.id}/messages?${params}`);
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
    fetchMessages();
  }, [channel.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new DMs
  useEffect(() => {
    if (!socket) return;

    const handleNewDM = (msg: DMMessage) => {
      if (msg.dmChannelId === channel.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("dm:new", handleNewDM);
    return () => {
      socket.off("dm:new", handleNewDM);
    };
  }, [socket, channel.id]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/dm/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) setContent("");
    } catch {
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  const otherUser = channel.members[0];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Header */}
      <header className="h-[49px] flex items-center px-4 border-b border-[#e0e0e0] shrink-0">
        <div className="flex items-center gap-2">
          {otherUser && (
            <Avatar
              displayName={otherUser.displayName}
              avatarUrl={otherUser.avatarUrl}
              userId={otherUser.userId}
              size="md"
              showPresence={true}
            />
          )}
          <h2 className="font-bold text-[#1d1c1d] text-[17px]">
            {channel.displayName}
          </h2>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto main-scroll">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[#616061] text-sm">
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-start px-5 pt-16 pb-4">
            {otherUser && (
              <Avatar
                displayName={otherUser.displayName}
                avatarUrl={otherUser.avatarUrl}
                userId={otherUser.userId}
                size="lg"
                showPresence={true}
              />
            )}
            <h3 className="text-[22px] font-bold text-[#1d1c1d] mt-3 mb-1">
              {channel.displayName}
            </h3>
            <p className="text-[15px] text-[#616061]">
              This is the very beginning of your direct message history with{" "}
              <strong>{channel.displayName}</strong>.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg, i) => {
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showDivider =
                !prevMsg ||
                new Date(msg.createdAt).toDateString() !==
                  new Date(prevMsg.createdAt).toDateString();

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
                  <div className="group flex gap-2.5 px-5 py-[5px] hover:bg-[#f8f8f8] transition-colors">
                    <Avatar
                      displayName={msg.displayName}
                      avatarUrl={msg.avatarUrl}
                      userId={msg.userId}
                      size="md"
                      showPresence={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-[#1d1c1d] text-[15px]">
                          {msg.displayName}
                        </span>
                        <span className="text-xs text-[#616061]">
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </span>
                      </div>
                      <div className="text-[15px] leading-[1.46] text-[#1d1c1d] whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-1 shrink-0">
        <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:border-[#1264a3] focus-within:shadow-[0_0_0_1px_#1264a3] transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${channel.displayName}`}
            className="w-full px-3 py-2 text-[15px] text-[#1d1c1d] placeholder:text-[#868686] resize-none focus:outline-none max-h-[200px]"
            rows={1}
          />
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-0.5">
              <button className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors">
                <Paperclip size={16} />
              </button>
              <button className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors">
                <Smile size={16} />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className={`p-2 rounded-lg text-white transition-all ${
                content.trim()
                  ? "bg-[#007a5a] hover:bg-[#006b4f]"
                  : "bg-[#007a5a]/30 cursor-not-allowed"
              }`}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
