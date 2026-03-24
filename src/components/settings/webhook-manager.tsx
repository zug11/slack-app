"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Trash2, Link2 } from "lucide-react";

interface Webhook { id: string; name: string; token: string; channelId: string | null; isActive: boolean; createdAt: string; }

export function WebhookManager({ workspaceId }: { workspaceId: string }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchWebhooks(); }, [workspaceId]);

  async function fetchWebhooks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/webhooks?workspaceId=${workspaceId}`);
      if (res.ok) { const data = await res.json(); setWebhooks(data.webhooks || []); }
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, name: name.trim() }) });
      if (res.ok) { setName(""); fetchWebhooks(); }
    } catch {} finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    fetchWebhooks();
  }

  function copyUrl(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/incoming/${token}`);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Webhook name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:border-[#1264a3]" />
        <button type="submit" disabled={creating || !name.trim()} className="px-4 py-2 bg-[#007a5a] text-white rounded-lg text-[14px] hover:bg-[#006b4f] disabled:opacity-50 flex items-center gap-1.5">
          <Plus size={14} />{creating ? "Creating..." : "Create"}
        </button>
      </form>
      {loading ? <p className="text-[13px] text-[#616061]">Loading...</p> : webhooks.length === 0 ? <p className="text-[13px] text-[#616061]">No webhooks yet</p> : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between p-3 border border-[#e0e0e0] rounded-lg">
              <div>
                <div className="flex items-center gap-2"><Link2 size={14} className="text-[#616061]" /><span className="text-[14px] font-medium text-[#1d1c1d]">{wh.name}</span></div>
                <p className="text-[12px] text-[#616061] mt-0.5 font-mono truncate max-w-[300px]">{`/api/webhooks/incoming/${wh.token}`}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyUrl(wh.token)} className="p-1.5 hover:bg-gray-100 rounded text-[#616061]" title="Copy URL"><Copy size={14} /></button>
                <button onClick={() => handleDelete(wh.id)} className="p-1.5 hover:bg-gray-100 rounded text-[#616061] hover:text-[#e01e5a]" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
