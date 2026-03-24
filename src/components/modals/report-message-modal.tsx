"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "nsfw", label: "NSFW content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
] as const;

export function ReportMessageModal({
  messageId,
  workspaceId,
  onClose,
}: {
  messageId: string;
  workspaceId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);

    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, messageId, reason, details: details || undefined }),
      });
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch {} finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#e01e5a]" />
            <h2 className="text-[18px] font-bold text-[#1d1c1d]">Report message</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#616061]">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 pb-6 pt-4 text-center">
            <p className="text-[15px] text-[#1d1c1d] font-medium">Report submitted</p>
            <p className="text-[13px] text-[#616061] mt-1">Thank you. An admin will review this.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2">
            <p className="text-[13px] text-[#616061] mb-4">
              Why are you reporting this message?
            </p>

            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[#f8f8f8]">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[#e01e5a]"
                  />
                  <span className="text-[14px] text-[#1d1c1d]">{r.label}</span>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
                Additional details <span className="font-normal text-[#616061]">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] resize-none focus:outline-none focus:border-[#1264a3]"
                rows={3}
                placeholder="Provide any additional context..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason || submitting}
                className="px-4 py-2 text-[14px] bg-[#e01e5a] text-white rounded-lg hover:bg-[#c91c50] disabled:opacity-50 font-medium"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
