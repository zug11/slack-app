"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        return;
      }
      router.push(`/${data.workspace.slug}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4a154b]">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
          S
        </div>
      </div>
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-8">
        <h2 className="text-[22px] font-bold text-[#1d1c1d] text-center mb-1">
          Create a workspace
        </h2>
        <p className="text-[15px] text-[#616061] text-center mb-6">
          Get started by creating your first workspace
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#e01e5a] rounded-lg text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
              placeholder="My Team"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
              URL
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
              placeholder="my-team"
            />
            <p className="mt-1 text-[12px] text-[#616061]">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#4a154b] text-white rounded-lg hover:bg-[#3f0e40] disabled:opacity-50 font-medium text-[15px] transition-colors"
          >
            {loading ? "Creating..." : "Create Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
