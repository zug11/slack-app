"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";

interface Member {
  memberId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  email: string;
}

const ROLE_OPTIONS = ["owner", "admin", "moderator", "member", "guest"] as const;

export function WorkspaceMembers({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdatingId(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.memberId === memberId ? { ...m, role: newRole } : m
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleKick(memberId: string, displayName: string) {
    if (!confirm(`Remove ${displayName} from this workspace?`)) return;

    setUpdatingId(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.memberId !== memberId));
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="text-sm text-[#616061]">Loading members...</div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1d1c1d] mb-4">
        Members ({members.length})
      </h2>

      <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f8f8f8] border-b border-[#e0e0e0]">
              <th className="text-left text-xs font-medium text-[#616061] uppercase tracking-wider px-4 py-3">
                Member
              </th>
              <th className="text-left text-xs font-medium text-[#616061] uppercase tracking-wider px-4 py-3">
                Role
              </th>
              <th className="text-left text-xs font-medium text-[#616061] uppercase tracking-wider px-4 py-3">
                Joined
              </th>
              <th className="text-right text-xs font-medium text-[#616061] uppercase tracking-wider px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.memberId}
                className="border-b border-[#e0e0e0] last:border-b-0 hover:bg-[#f8f8f8]"
              >
                {/* Avatar + Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      displayName={member.displayName}
                      avatarUrl={member.avatarUrl}
                      userId={member.userId}
                      size="md"
                    />
                    <div>
                      <div className="text-sm font-medium text-[#1d1c1d]">
                        {member.displayName}
                      </div>
                      <div className="text-xs text-[#616061]">
                        @{member.username}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role Dropdown */}
                <td className="px-4 py-3">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.memberId, e.target.value)
                    }
                    disabled={
                      member.role === "owner" || updatingId === member.memberId
                    }
                    className="px-2 py-1 border border-[#e0e0e0] rounded text-sm text-[#1d1c1d] bg-white focus:outline-none focus:border-[#007a5a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Joined Date */}
                <td className="px-4 py-3 text-sm text-[#616061]">
                  {formatDate(member.joinedAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  {member.role !== "owner" && (
                    <button
                      onClick={() =>
                        handleKick(member.memberId, member.displayName)
                      }
                      disabled={updatingId === member.memberId}
                      className="px-3 py-1 text-sm font-medium text-white bg-[#e01e5a] rounded hover:bg-[#c4164d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Kick
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#616061]">
            No members found.
          </div>
        )}
      </div>
    </div>
  );
}
