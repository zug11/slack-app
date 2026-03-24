"use client";

import { PresenceIndicator } from "./presence-indicator";
import { usePresenceStore } from "@/stores/presence-store";

const sizeClasses = {
  sm: "w-5 h-5 text-[9px]",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-lg",
};

const presencePositions = {
  sm: "-bottom-0.5 -right-0.5",
  md: "-bottom-0.5 -right-0.5",
  lg: "bottom-0 right-0",
};

const presenceSizes = {
  sm: "sm" as const,
  md: "md" as const,
  lg: "lg" as const,
};

const bgColors = [
  "bg-[#e01e5a]",
  "bg-[#36c5f0]",
  "bg-[#2eb67d]",
  "bg-[#ecb22e]",
  "bg-[#4a154b]",
  "bg-[#1264a3]",
  "bg-[#e8912d]",
  "bg-[#007a5a]",
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({
  displayName,
  avatarUrl,
  userId,
  size = "md",
  showPresence = false,
  status,
  borderColor,
  onClick,
}: {
  displayName: string;
  avatarUrl?: string | null;
  userId?: string;
  size?: "sm" | "md" | "lg";
  showPresence?: boolean;
  status?: "online" | "idle" | "dnd" | "offline";
  borderColor?: "white" | "sidebar";
  onClick?: () => void;
}) {
  // If userId provided, read live status from presence store
  const storeStatus = usePresenceStore((s) =>
    userId ? s.presences[userId] : undefined
  );
  const effectiveStatus = storeStatus || status || "offline";

  const initial = displayName?.charAt(0)?.toUpperCase() || "?";
  const color = getColorForName(displayName || "");

  return (
    <div
      className={`relative inline-block shrink-0 ${sizeClasses[size]} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full rounded-lg object-cover"
        />
      ) : (
        <div
          className={`w-full h-full rounded-lg ${color} flex items-center justify-center text-white font-bold`}
        >
          {initial}
        </div>
      )}
      {showPresence && (
        <div className={`absolute ${presencePositions[size]}`}>
          <PresenceIndicator
            status={effectiveStatus as any}
            size={presenceSizes[size]}
            borderColor={borderColor}
          />
        </div>
      )}
    </div>
  );
}
