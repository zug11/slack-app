"use client";

import { useEffect, useState } from "react";
import { X, Hash, Lock, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Member {
  userId: string;
  role: string;
  joinedAt: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  topic: string | null;
  isPrivate: boolean;
}

export function ChannelInfoPanel({
  channel,
  onClose,
}: {
  channel: Channel;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(
          `/api/conversations/${channel.id}/members`
        );
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [channel.id]);

  return (
    <div className="w-[360px] border-l border-[#e0e0e0] flex flex-col bg-white shrink-0">
      {/* Header */}
      <div className="h-[49px] flex items-center justify-between px-4 border-b border-[#e0e0e0] shrink-0">
        <div className="flex items-center gap-2">
          {channel.isPrivate ? (
            <Lock size={16} className="text-[#616061]" />
          ) : (
            <Hash size={16} className="text-[#616061]" />
          )}
          <h3 className="font-bold text-[#1d1c1d] text-[15px]">
            {channel.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-gray-100 text-[#616061]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto main-scroll">
        {/* About */}
        <div className="px-4 py-4 border-b border-[#e0e0e0]">
          <h4 className="text-[13px] font-semibold text-[#1d1c1d] mb-2">
            About
          </h4>
          {channel.topic && (
            <div className="mb-2">
              <span className="text-[12px] text-[#616061]">Topic</span>
              <p className="text-[14px] text-[#1d1c1d]">{channel.topic}</p>
            </div>
          )}
          {channel.description && (
            <div>
              <span className="text-[12px] text-[#616061]">Description</span>
              <p className="text-[14px] text-[#1d1c1d]">
                {channel.description}
              </p>
            </div>
          )}
          {!channel.topic && !channel.description && (
            <p className="text-[14px] text-[#616061]">
              No description or topic set.
            </p>
          )}
        </div>

        {/* Members */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-[#616061]" />
            <h4 className="text-[13px] font-semibold text-[#1d1c1d]">
              Members ({members.length})
            </h4>
          </div>

          {loading ? (
            <p className="text-[13px] text-[#616061]">Loading...</p>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#f8f8f8] transition-colors"
                >
                  <Avatar
                    displayName={member.displayName}
                    avatarUrl={member.avatarUrl}
                    userId={member.userId}
                    size="md"
                    showPresence={true}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-[#1d1c1d] truncate block">
                      {member.displayName}
                    </span>
                    <span className="text-[12px] text-[#616061]">
                      {member.role === "owner" ? "Owner" : member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
