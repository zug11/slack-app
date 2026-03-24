"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BarChart3, Check } from "lucide-react";

interface PollOption {
  id: string;
  text: string;
  sortOrder: number;
  voteCount: number;
}

interface PollData {
  id: string;
  question: string;
  isAnonymous: boolean;
  isMultipleChoice: boolean;
  expiresAt: string | null;
  options: PollOption[];
  totalVotes: number;
  userVotes: string[]; // optionIds the current user voted for
}

export function PollDisplay({ metadata }: { metadata: any }) {
  const user = useCurrentUser();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);

  const pollId = metadata?.pollId;

  useEffect(() => {
    if (!pollId) return;
    fetchPoll();
  }, [pollId]);

  async function fetchPoll() {
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleVote(optionId: string) {
    if (!poll) return;

    const alreadyVoted = poll.userVotes.includes(optionId);

    try {
      if (alreadyVoted) {
        await fetch(`/api/polls/${pollId}/vote`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        });
      } else {
        await fetch(`/api/polls/${pollId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        });
      }
      await fetchPoll();
    } catch {}
  }

  if (!pollId) return null;
  if (loading) return <div className="text-[13px] text-[#616061]">Loading poll...</div>;
  if (!poll) return <div className="text-[13px] text-[#616061]">Poll not found</div>;

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

  return (
    <div className="mt-2 border border-[#e0e0e0] rounded-xl p-4 max-w-[400px] bg-[#fafafa]">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-[#1264a3]" />
        <h4 className="text-[15px] font-bold text-[#1d1c1d]">{poll.question}</h4>
      </div>

      {isExpired && (
        <div className="mb-2 text-[12px] text-[#e01e5a] font-medium">Poll has ended</div>
      )}

      <div className="space-y-2">
        {poll.options
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((opt) => {
            const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
            const voted = poll.userVotes.includes(opt.id);

            return (
              <button
                key={opt.id}
                onClick={() => !isExpired && handleVote(opt.id)}
                disabled={!!isExpired}
                className={`w-full text-left rounded-lg p-2.5 relative overflow-hidden transition-all ${
                  voted
                    ? "border-2 border-[#1264a3] bg-[#e8f0fe]"
                    : "border border-[#e0e0e0] bg-white hover:border-[#1264a3]"
                } ${isExpired ? "cursor-default" : "cursor-pointer"}`}
              >
                {/* Background bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all ${voted ? "bg-[#1264a3]/10" : "bg-gray-100"}`}
                  style={{ width: `${pct}%` }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {voted && <Check size={14} className="text-[#1264a3]" />}
                    <span className={`text-[14px] ${voted ? "font-medium text-[#1264a3]" : "text-[#1d1c1d]"}`}>
                      {opt.text}
                    </span>
                  </div>
                  <span className="text-[13px] text-[#616061] font-medium">
                    {pct}%
                  </span>
                </div>
              </button>
            );
          })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[12px] text-[#616061]">
        <span>{poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}</span>
        {poll.isAnonymous && <span>Anonymous</span>}
        {poll.isMultipleChoice && <span>Multiple choice</span>}
      </div>
    </div>
  );
}
