"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ShieldOff, UserX } from "lucide-react";

interface Ban { id: string; bannedUserId: string; bannedByUserId: string; reason: string | null; expiresAt: string | null; isActive: boolean; createdAt: string; bannedUserName?: string; bannedByName?: string; }

export function BanManager({ workspaceId }: { workspaceId: string }) {
  const [bans, setBans] = useState<Ban[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBans(); }, [workspaceId]);

  async function fetchBans() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bans?workspaceId=${workspaceId}`);
      if (res.ok) { const data = await res.json(); setBans(data.bans || []); }
    } catch {} finally { setLoading(false); }
  }

  async function handleUnban(banId: string) {
    if (!confirm("Unban this user?")) return;
    await fetch(`/api/bans`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ banId }) });
    fetchBans();
  }

  if (loading) return <p className="text-[13px] text-[#616061]">Loading...</p>;
  if (bans.length === 0) return (
    <div className="text-center py-8">
      <ShieldOff size={32} className="text-[#616061] mx-auto mb-2" />
      <p className="text-[13px] text-[#616061]">No active bans</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {bans.map((ban) => (
        <div key={ban.id} className="flex items-center justify-between p-3 border border-[#e0e0e0] rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <UserX size={14} className="text-[#e01e5a]" />
              <span className="text-[14px] font-medium text-[#1d1c1d]">{ban.bannedUserName || ban.bannedUserId}</span>
            </div>
            {ban.reason && <p className="text-[12px] text-[#616061] mt-0.5">Reason: {ban.reason}</p>}
            <p className="text-[12px] text-[#616061]">
              Banned {format(new Date(ban.createdAt), "MMM d, yyyy")}
              {ban.expiresAt && ` · Expires ${format(new Date(ban.expiresAt), "MMM d, yyyy")}`}
            </p>
          </div>
          <button onClick={() => handleUnban(ban.id)} className="px-3 py-1.5 text-[13px] border border-gray-300 rounded-lg hover:bg-gray-50">Unban</button>
        </div>
      ))}
    </div>
  );
}
