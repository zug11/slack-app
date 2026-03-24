"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Shield } from "lucide-react";

interface AuditEntry { id: string; action: string; entityType: string; entityId: string | null; actorName?: string; createdAt: string; changes: any; }

export function AuditLogViewer({ workspaceId }: { workspaceId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => { fetchLogs(); }, [workspaceId]);

  async function fetchLogs(loadMore = false) {
    setLoading(true);
    try {
      const o = loadMore ? offset + 50 : 0;
      const res = await fetch(`/api/audit-logs?workspaceId=${workspaceId}&limit=50&offset=${o}`);
      if (res.ok) {
        const data = await res.json();
        if (loadMore) { setLogs((prev) => [...prev, ...(data.logs || [])]); } else { setLogs(data.logs || []); }
        setOffset(o);
      }
    } catch {} finally { setLoading(false); }
  }

  const actionColors: Record<string, string> = {
    create: "bg-[#007a5a] text-white", delete: "bg-[#e01e5a] text-white", update: "bg-[#1264a3] text-white",
    invite: "bg-[#e8912d] text-white", kick: "bg-[#e01e5a] text-white", ban: "bg-[#e01e5a] text-white",
  };

  function getActionColor(action: string) {
    for (const [key, cls] of Object.entries(actionColors)) { if (action.includes(key)) return cls; }
    return "bg-gray-200 text-[#1d1c1d]";
  }

  return (
    <div>
      {loading && logs.length === 0 ? <p className="text-[13px] text-[#616061]">Loading audit logs...</p> : logs.length === 0 ? (
        <div className="text-center py-8">
          <Shield size={32} className="text-[#616061] mx-auto mb-2" />
          <p className="text-[13px] text-[#616061]">No audit logs yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#f8f8f8] rounded-lg text-[13px]">
              <span className="text-[#616061] w-36 shrink-0">{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getActionColor(log.action)}`}>{log.action}</span>
              <span className="text-[#1d1c1d]">{log.entityType}</span>
              {log.actorName && <span className="text-[#616061]">by {log.actorName}</span>}
            </div>
          ))}
          <button onClick={() => fetchLogs(true)} className="text-[13px] text-[#1264a3] hover:underline mt-2">Load more</button>
        </div>
      )}
    </div>
  );
}
