"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Smile } from "lucide-react";

interface CustomEmoji { id: string; name: string; imageUrl: string; createdAt: string; }

export function EmojiManager({ workspaceId }: { workspaceId: string }) {
  const [emojis, setEmojis] = useState<CustomEmoji[]>([]);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchEmojis(); }, [workspaceId]);

  async function fetchEmojis() {
    setLoading(true);
    try {
      const res = await fetch(`/api/emoji?workspaceId=${workspaceId}`);
      if (res.ok) { const data = await res.json(); setEmojis(data.emojis || []); }
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/emoji", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, name: name.trim(), imageUrl: imageUrl.trim() }) });
      if (res.ok) { setName(""); setImageUrl(""); fetchEmojis(); }
    } catch {} finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this emoji?")) return;
    await fetch(`/api/emoji/${id}`, { method: "DELETE" });
    fetchEmojis();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="flex gap-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Emoji name (e.g. party_parrot)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:border-[#1264a3]" />
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:border-[#1264a3]" />
          <button type="submit" disabled={creating || !name.trim() || !imageUrl.trim()} className="px-4 py-2 bg-[#007a5a] text-white rounded-lg text-[14px] hover:bg-[#006b4f] disabled:opacity-50 flex items-center gap-1.5">
            <Plus size={14} />{creating ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
      {loading ? <p className="text-[13px] text-[#616061]">Loading...</p> : emojis.length === 0 ? (
        <div className="text-center py-8">
          <Smile size={32} className="text-[#616061] mx-auto mb-2" />
          <p className="text-[13px] text-[#616061]">No custom emojis yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {emojis.map((emoji) => (
            <div key={emoji.id} className="flex items-center justify-between p-2 border border-[#e0e0e0] rounded-lg">
              <div className="flex items-center gap-2">
                <img src={emoji.imageUrl} alt={emoji.name} className="w-8 h-8 object-contain" />
                <span className="text-[14px] text-[#1d1c1d]">:{emoji.name}:</span>
              </div>
              <button onClick={() => handleDelete(emoji.id)} className="p-1.5 hover:bg-gray-100 rounded text-[#616061] hover:text-[#e01e5a]"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
