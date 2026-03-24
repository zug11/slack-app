"use client";

import { addMinutes, addHours, setHours, setMinutes, addDays, nextMonday } from "date-fns";
import { Clock, X } from "lucide-react";

const options = [
  { label: "In 20 minutes", getDate: () => addMinutes(new Date(), 20) },
  { label: "In 1 hour", getDate: () => addHours(new Date(), 1) },
  { label: "In 3 hours", getDate: () => addHours(new Date(), 3) },
  {
    label: "Tomorrow at 9:00 AM",
    getDate: () => setMinutes(setHours(addDays(new Date(), 1), 9), 0),
  },
  {
    label: "Next Monday at 9:00 AM",
    getDate: () => setMinutes(setHours(nextMonday(new Date()), 9), 0),
  },
];

export function ReminderPicker({
  messageId,
  workspaceId,
  onClose,
}: {
  messageId: string;
  workspaceId: string;
  onClose: () => void;
}) {
  async function handleSelect(remindAt: Date) {
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          messageId,
          text: "Reminder about a message",
          remindAt: remindAt.toISOString(),
        }),
      });
    } catch {}
    onClose();
  }

  return (
    <div className="absolute right-0 top-full mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-50 w-64 py-1">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#e0e0e0]">
        <span className="text-[13px] font-semibold text-[#1d1c1d]">
          Remind me
        </span>
        <button onClick={onClose} className="text-[#616061] hover:text-[#1d1c1d]">
          <X size={14} />
        </button>
      </div>
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => handleSelect(opt.getDate())}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] transition-colors text-left"
        >
          <Clock size={14} className="text-[#616061] shrink-0" />
          {opt.label}
        </button>
      ))}
    </div>
  );
}
