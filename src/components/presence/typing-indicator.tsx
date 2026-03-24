"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useCurrentUser } from "@/hooks/use-current-user";

interface TypingUser {
  userId: string;
  displayName: string;
  timeout: NodeJS.Timeout;
}

export function TypingIndicator({
  conversationId,
}: {
  conversationId: string;
}) {
  const { socket } = useSocket();
  const user = useCurrentUser();
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(
    new Map()
  );

  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      displayName: string;
    }) => {
      if (data.conversationId !== conversationId || data.userId === user.id)
        return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) clearTimeout(existing.timeout);
        const timeout = setTimeout(() => {
          setTypingUsers((p) => {
            const n = new Map(p);
            n.delete(data.userId);
            return n;
          });
        }, 4000);
        next.set(data.userId, {
          userId: data.userId,
          displayName: data.displayName,
          timeout,
        });
        return next;
      });
    };

    const handleTypingStop = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId !== conversationId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) clearTimeout(existing.timeout);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, conversationId, user.id]);

  const names = Array.from(typingUsers.values()).map((u) => u.displayName);

  if (names.length === 0) return <div className="h-5 px-5" />;

  let text = "";
  if (names.length === 1) text = `${names[0]} is typing...`;
  else if (names.length === 2)
    text = `${names[0]} and ${names[1]} are typing...`;
  else text = `${names[0]} and ${names.length - 1} others are typing...`;

  return (
    <div className="h-5 px-5 text-[12px] text-[#616061] flex items-center">
      <span className="animate-pulse">{text}</span>
    </div>
  );
}
