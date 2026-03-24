"use client";

import { useState } from "react";
import { X, Plus, Trash2, BarChart3 } from "lucide-react";

export function PollCreator({
  channelId,
  onClose,
  onCreated,
}: {
  channelId: string;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, value: string) {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validOptions = options.filter((o) => o.trim());
    if (!question.trim()) { setError("Question is required"); return; }
    if (validOptions.length < 2) { setError("At least 2 options required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          question: question.trim(),
          options: validOptions,
          isAnonymous,
          isMultipleChoice,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create poll");
        return;
      }

      onCreated?.();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[#1264a3]" />
            <h2 className="text-[18px] font-bold text-[#1d1c1d]">Create a poll</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#616061]">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-2 p-3 bg-red-50 border border-red-200 text-[#e01e5a] rounded-lg text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] focus:outline-none focus:border-[#1264a3]"
              placeholder="What do you want to ask?"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1d1c1d] mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[13px] text-[#616061] w-5 text-right shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:border-[#1264a3]"
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="p-1.5 text-[#616061] hover:text-[#e01e5a] hover:bg-gray-100 rounded">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button type="button" onClick={addOption} className="mt-2 flex items-center gap-1.5 text-[13px] text-[#1264a3] hover:underline">
                <Plus size={14} /> Add option
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-[#007a5a]" />
              <span className="text-[13px] text-[#1d1c1d]">Anonymous</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isMultipleChoice} onChange={(e) => setIsMultipleChoice(e.target.checked)} className="accent-[#007a5a]" />
              <span className="text-[13px] text-[#1d1c1d]">Multiple choice</span>
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[14px] border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2.5 text-[14px] bg-[#007a5a] text-white rounded-lg hover:bg-[#006b4f] disabled:opacity-50 font-medium">
              {submitting ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
