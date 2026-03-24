"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Hash, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface SearchResult {
  id: string;
  channelId: string;
  content: string | null;
  createdAt: string;
  displayName: string;
  username: string;
  channelName: string | null;
}

export function SearchModal({
  workspaceId,
  workspaceSlug,
  onClose,
}: {
  workspaceId: string;
  workspaceSlug: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?workspaceId=${workspaceId}&q=${encodeURIComponent(value)}&limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleResultClick(result: SearchResult) {
    onClose();
    router.push(`/${workspaceSlug}/${result.channelId}`);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[640px] max-h-[60vh] flex flex-col overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e0e0e0]">
          <Search size={18} className="text-[#616061] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages, channels, people..."
            className="flex-1 text-[15px] text-[#1d1c1d] placeholder:text-[#868686] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-[#616061]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-[#616061] text-sm">
              Searching...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-[#616061] text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !query && (
            <div className="px-4 py-8 text-center text-[#616061] text-sm">
              Start typing to search
            </div>
          )}

          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 hover:bg-[#f8f8f8] text-left flex gap-3 transition-colors border-b border-[#f0f0f0] last:border-0"
            >
              <div className="w-8 h-8 rounded bg-[#f0f4f8] flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare size={14} className="text-[#616061]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[13px] text-[#616061] mb-0.5">
                  <span className="font-medium text-[#1d1c1d]">
                    {result.displayName}
                  </span>
                  {result.channelName && (
                    <>
                      <span>in</span>
                      <span className="flex items-center gap-0.5">
                        <Hash size={11} />
                        {result.channelName}
                      </span>
                    </>
                  )}
                  <span>
                    {format(new Date(result.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-[14px] text-[#1d1c1d] truncate">
                  {result.content}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#e0e0e0] text-[12px] text-[#616061]">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px]">
            Esc
          </kbd>{" "}
          to close
        </div>
      </div>
    </div>
  );
}
