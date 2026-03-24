"use client";

import { useState } from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  settings: Record<string, unknown> | null;
}

export function WorkspaceGeneral({
  workspace,
  onUpdate,
}: {
  workspace: Workspace;
  onUpdate: (ws: Workspace) => void;
}) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update workspace");
      }

      const data = await res.json();
      onUpdate(data.workspace);
      setMessage({ type: "success", text: "Workspace updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-[#1d1c1d] mb-4">
        General Settings
      </h2>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="workspace-name"
            className="block text-sm font-medium text-[#1d1c1d] mb-1"
          >
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-[#e0e0e0] rounded-md text-sm text-[#1d1c1d] bg-white placeholder-[#616061] focus:outline-none focus:border-[#007a5a] focus:ring-1 focus:ring-[#007a5a]"
            placeholder="e.g. My Team"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="workspace-desc"
            className="block text-sm font-medium text-[#1d1c1d] mb-1"
          >
            Description
          </label>
          <textarea
            id="workspace-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-[#e0e0e0] rounded-md text-sm text-[#1d1c1d] bg-white placeholder-[#616061] focus:outline-none focus:border-[#007a5a] focus:ring-1 focus:ring-[#007a5a] resize-none"
            placeholder="What is this workspace about?"
          />
        </div>

        {/* Message */}
        {message && (
          <div
            className={`text-sm px-3 py-2 rounded-md ${
              message.type === "success"
                ? "bg-[#e8f5e9] text-[#007a5a]"
                : "bg-[#fce4ec] text-[#e01e5a]"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-4 py-2 bg-[#007a5a] text-white text-sm font-medium rounded-md hover:bg-[#005e44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
