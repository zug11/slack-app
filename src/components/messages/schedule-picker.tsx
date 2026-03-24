"use client";

import { useState } from "react";
import { X, Clock, Calendar } from "lucide-react";

function addMinutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function getTomorrowAt9(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function SchedulePicker({
  channelId,
  workspaceId,
  content,
  onScheduled,
  onClose,
}: {
  channelId: string;
  workspaceId: string;
  content: string;
  onScheduled: () => void;
  onClose: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("09:00");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function schedule(scheduledAt: Date) {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, channelId, content, scheduledAt: scheduledAt.toISOString() }),
      });
      if (!res.ok) { setError("Failed to schedule"); return; }
      onScheduled();
    } catch { setError("Something went wrong"); } finally { setSending(false); }
  }

  return (
    <div className="absolute bottom-full right-0 mb-2 w-72 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0]">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#616061]" />
          <span className="text-sm font-bold text-[#1d1c1d]">Schedule message</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[#f8f8f8] text-[#616061]"><X size={16} /></button>
      </div>
      {error && <div className="mx-3 mt-2 p-2 bg-red-50 text-[#e01e5a] rounded text-xs">{error}</div>}
      <div className="py-1">
        <button onClick={() => schedule(addMinutesFromNow(20))} disabled={sending} className="w-full text-left px-4 py-2 text-sm text-[#1d1c1d] hover:bg-[#f8f8f8]">In 20 minutes</button>
        <button onClick={() => schedule(addMinutesFromNow(60))} disabled={sending} className="w-full text-left px-4 py-2 text-sm text-[#1d1c1d] hover:bg-[#f8f8f8]">In 1 hour</button>
        <button onClick={() => schedule(addMinutesFromNow(180))} disabled={sending} className="w-full text-left px-4 py-2 text-sm text-[#1d1c1d] hover:bg-[#f8f8f8]">In 3 hours</button>
        <button onClick={() => schedule(getTomorrowAt9())} disabled={sending} className="w-full text-left px-4 py-2 text-sm text-[#1d1c1d] hover:bg-[#f8f8f8]">Tomorrow at 9:00 AM</button>
        <div className="border-t border-[#e0e0e0] my-1" />
        <button onClick={() => setShowCustom(!showCustom)} className="w-full text-left px-4 py-2 text-sm text-[#1d1c1d] hover:bg-[#f8f8f8] flex items-center gap-2">
          <Calendar size={14} className="text-[#616061]" />Custom date & time
        </button>
      </div>
      {showCustom && (
        <div className="px-4 pb-3 space-y-2 border-t border-[#e0e0e0] pt-3">
          <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-1.5 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#007a5a]" />
          <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full px-3 py-1.5 border border-[#e0e0e0] rounded text-sm focus:outline-none focus:border-[#007a5a]" />
          <button onClick={() => { if (customDate && customTime) schedule(new Date(`${customDate}T${customTime}`)); }} disabled={sending || !customDate} className="w-full py-2 bg-[#007a5a] text-white text-sm rounded hover:bg-[#005e44] disabled:opacity-50">
            {sending ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      )}
    </div>
  );
}
