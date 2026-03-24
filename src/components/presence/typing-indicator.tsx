"use client";

import { useEffect, useState } from "react";
import { useBroadcast } from "@/hooks/use-realtime";
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
  const user = useCurrentUser();
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(
    new Map()
  );

  const { onBroadcast } = useBroadcast(`typing:${conversationId}`);

  useEffect(() => {
    onBroadcast("typing:start", (data: any) => {
      if (data.userId === user.id) return;
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
        next.set(data.userId, { userId: data.userId, displayName: data.displayName || "Someone", timeout });
        return next;
      });
    });

    onBroadcast("typing:stop", (data: any) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) clearTimeout(existing.timeout);
        next.delete(data.userId);
        return next;
      });
    });
  }, [conversationId, user.id]);

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
