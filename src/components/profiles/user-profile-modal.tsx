"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, MessageSquare, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePresenceStore } from "@/stores/presence-store";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  timezone: string;
  createdAt: string;
}

export function UserProfileModal({
  userId,
  onClose,
  workspaceSlug,
  workspaceId,
}: {
  userId: string;
  onClose: () => void;
  workspaceSlug: string;
  workspaceId: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const status = usePresenceStore((s) => s.presences[userId] || "offline");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  async function handleMessage() {
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, userIds: [userId] }),
      });
      if (res.ok) {
        const data = await res.json();
        onClose();
        router.push(`/${workspaceSlug}/dms/${data.channel.id}`);
      }
    } catch {}
  }

  const statusLabel =
    status === "online"
      ? "Active"
      : status === "idle"
        ? "Away"
        : status === "dnd"
          ? "Do not disturb"
          : "Offline";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#616061]"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="px-6 pb-6 text-center text-[#616061]">Loading...</div>
        ) : profile ? (
          <div className="px-6 pb-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center mb-4">
              <Avatar
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
                userId={profile.id}
                size="lg"
                showPresence={true}
              />
              <h3 className="text-[22px] font-bold text-[#1d1c1d] mt-3">
                {profile.displayName}
              </h3>
              <p className="text-[13px] text-[#616061]">@{profile.username}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[13px] text-[#616061]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    status === "online"
                      ? "bg-[#007a5a]"
                      : status === "idle"
                        ? "bg-[#e8912d]"
                        : "bg-gray-400"
                  }`}
                />
                {statusLabel}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-[14px] text-[#1d1c1d] mb-4 text-center">
                {profile.bio}
              </p>
            )}

            {/* Info */}
            <div className="space-y-2 text-[13px] text-[#616061] mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>
                  Local time:{" "}
                  {format(new Date(), "h:mm a")} ({profile.timezone})
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleMessage}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#007a5a] text-white rounded-lg hover:bg-[#006b4f] text-[14px] font-medium transition-colors"
              >
                <MessageSquare size={16} />
                Message
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6 text-center text-[#616061]">
            User not found
          </div>
        )}
      </div>
    </div>
  );
}
