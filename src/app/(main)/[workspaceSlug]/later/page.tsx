"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bookmark, X, Hash, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface SavedMessage {
  id: string;
  messageId: string;
  note: string | null;
  createdAt: string;
  messageContent: string | null;
  messageCreatedAt: string;
  authorName: string;
  authorAvatar: string | null;
  channelName: string | null;
}

export default function LaterPage() {
  const params = useParams();
  const [bookmarks, setBookmarks] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Resolve workspace ID from slug
  useEffect(() => {
    async function resolve() {
      try {
        const res = await fetch("/api/workspaces");
        if (res.ok) {
          const data = await res.json();
          const ws = data.workspaces?.find(
            (w: any) => w.slug === params.workspaceSlug
          );
          if (ws) setWorkspaceId(ws.id);
        }
      } catch {}
    }
    resolve();
  }, [params.workspaceSlug]);

  useEffect(() => {
    if (!workspaceId) return;
    fetchBookmarks();
  }, [workspaceId]);

  async function fetchBookmarks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookmarks?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleRemove(messageId: string) {
    await fetch("/api/bookmarks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    setBookmarks((prev) => prev.filter((b) => b.messageId !== messageId));
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-[#616061] text-sm">
        Loading saved messages...
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-[#616061]">
        <div className="w-16 h-16 rounded-2xl bg-[#f0f4f8] flex items-center justify-center mb-4">
          <Bookmark size={32} className="text-[#616061]" />
        </div>
        <h2 className="text-[22px] font-bold text-[#1d1c1d] mb-2">Later</h2>
        <p className="text-[15px] max-w-md text-center">
          Save messages to read later. Bookmark any message and it will show up
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <header className="h-[49px] flex items-center px-5 border-b border-[#e0e0e0] shrink-0">
        <Bookmark size={18} className="text-[#616061] mr-2" />
        <h2 className="font-bold text-[#1d1c1d] text-[17px]">Later</h2>
        <span className="ml-2 text-[13px] text-[#616061]">
          {bookmarks.length} saved
        </span>
      </header>

      <div className="flex-1 overflow-y-auto main-scroll">
        {bookmarks.map((bk) => (
          <div
            key={bk.id}
            className="px-5 py-3 border-b border-[#f0f0f0] hover:bg-[#f8f8f8] transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-[13px] text-[#616061]">
                <span className="font-medium text-[#1d1c1d]">
                  {bk.authorName}
                </span>
                {bk.channelName && (
                  <>
                    <span>in</span>
                    <span className="flex items-center gap-0.5">
                      <Hash size={11} />
                      {bk.channelName}
                    </span>
                  </>
                )}
                <span>{format(new Date(bk.messageCreatedAt), "MMM d, h:mm a")}</span>
              </div>
              <button
                onClick={() => handleRemove(bk.messageId!)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-100 text-[#616061] hover:text-[#e01e5a] transition-all"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-[15px] text-[#1d1c1d] line-clamp-3">
              {bk.messageContent}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
