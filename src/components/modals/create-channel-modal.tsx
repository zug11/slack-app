"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Hash, Lock } from "lucide-react";

export function CreateChannelModal({
  workspaceId,
  workspaceSlug,
  onClose,
}: {
  workspaceId: string;
  workspaceSlug: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          type: "text",
          name,
          slug,
          description,
          isPrivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create channel");
        return;
      }
      onClose();
      router.push(`/${workspaceSlug}/${data.conversation.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[22px] font-bold text-[#1d1c1d]">
            Create a channel
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#616061] hover:text-[#1d1c1d] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="px-6 text-[13px] text-[#616061] mb-4">
          Channels are where your team communicates. They&apos;re best organized
          around a topic.
        </p>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 text-[#e01e5a] rounded-lg text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
              Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616061]">
                {isPrivate ? (
                  <Lock size={14} />
                ) : (
                  <Hash size={14} />
                )}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
                placeholder="e.g. plan-budget"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
              Description{" "}
              <span className="font-normal text-[#616061]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all resize-none"
              rows={2}
              placeholder="What's this channel about?"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[15px] font-medium text-[#1d1c1d]">
                Make private
              </p>
              <p className="text-[13px] text-[#616061]">
                Only specific people can view this channel
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isPrivate ? "bg-[#007a5a]" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  isPrivate ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[15px] border border-gray-300 rounded-lg hover:bg-gray-50 text-[#1d1c1d] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="px-4 py-2.5 text-[15px] bg-[#007a5a] text-white rounded-lg hover:bg-[#006b4f] disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
