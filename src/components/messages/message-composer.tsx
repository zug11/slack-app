"use client";

import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { EmojiPickerFull } from "./emoji-picker-full";
import { SchedulePicker } from "./schedule-picker";
import { PollCreator } from "./poll-creator";
import {
  Send,
  Paperclip,
  Smile,
  AtSign,
  Bold,
  Italic,
  Strikethrough,
  Link2,
  List,
  ListOrdered,
  Code,
  ChevronDown,
  Plus,
  BarChart3,
  X,
  FileIcon,
} from "lucide-react";

export function MessageComposer({
  channelId,
  workspaceId,
  channelName,
  threadId,
  placeholder,
  onMessageSent,
}: {
  channelId: string;
  workspaceId?: string;
  channelName?: string | null;
  threadId?: string;
  placeholder?: string;
  onMessageSent?: (message?: any) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const defaultPlaceholder = channelName
    ? `Message #${channelName}`
    : "Write a message...";

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [content]);

  function handleTyping() {
    if (!socket) return;
    socket.emit("typing:start", { conversationId: channelId, threadRootId: threadId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: channelId, threadRootId: threadId });
    }, 3000);
  }

  async function handleSend() {
    const trimmed = content.trim();
    if ((!trimmed && pendingFiles.length === 0) || sending) return;
    setSending(true);

    if (socket) {
      socket.emit("typing:stop", { conversationId: channelId, threadRootId: threadId });
    }

    try {
      // Upload files first if any
      let fileNames: string[] = [];
      if (pendingFiles.length > 0) {
        setUploading(true);
        for (const file of pendingFiles) {
          const formData = new FormData();
          formData.append("file", file);
          if (workspaceId) formData.append("workspaceId", workspaceId);
          try {
            await fetch("/api/files/upload", { method: "POST", body: formData });
            fileNames.push(file.name);
          } catch {}
        }
        setUploading(false);
      }

      // Build message content
      let messageContent = trimmed;
      if (fileNames.length > 0 && !messageContent) {
        messageContent = `Shared ${fileNames.length} file${fileNames.length > 1 ? "s" : ""}: ${fileNames.join(", ")}`;
      } else if (fileNames.length > 0) {
        messageContent += `\n\n📎 ${fileNames.join(", ")}`;
      }

      if (messageContent) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, content: messageContent, threadId }),
        });
        if (res.ok) {
          const data = await res.json();
          setContent("");
          setPendingFiles([]);
          onMessageSent?.(data.message);
        }
      }
    } catch {
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function removePendingFile(idx: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function wrapSelection(before: string, after: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      const newPos = selected ? start + before.length + selected.length + after.length : start + before.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const newContent = content.slice(0, start) + text + content.slice(start);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }

  const hasContent = content.trim().length > 0 || pendingFiles.length > 0;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowPlusMenu(false);
        setShowEmojiPicker(false);
        setShowSchedulePicker(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="px-4 pb-4 pt-1 shrink-0 relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }}
      />

      <div className={`border rounded-xl transition-all ${hasContent ? "border-[#1264a3] shadow-[0_0_0_1px_#1264a3]" : "border-gray-300"}`}>
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100">
          <button onClick={() => wrapSelection("**", "**")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Bold"><Bold size={15} /></button>
          <button onClick={() => wrapSelection("_", "_")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Italic"><Italic size={15} /></button>
          <button onClick={() => wrapSelection("~~", "~~")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Strikethrough"><Strikethrough size={15} /></button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button onClick={() => wrapSelection("[", "](url)")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Link"><Link2 size={15} /></button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button onClick={() => insertAtCursor("\n1. ")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Numbered list"><ListOrdered size={15} /></button>
          <button onClick={() => insertAtCursor("\n- ")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Bullet list"><List size={15} /></button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button onClick={() => wrapSelection("`", "`")} className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors" title="Code"><Code size={15} /></button>
        </div>

        {/* Pending file previews */}
        {pendingFiles.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-2">
            {pendingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-[#f0f4f8] rounded-lg px-2.5 py-1.5 text-[13px] text-[#1d1c1d]">
                <FileIcon size={14} className="text-[#616061]" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-[11px] text-[#616061]">({(file.size / 1024).toFixed(0)}KB)</span>
                <button onClick={() => removePendingFile(idx)} className="p-0.5 hover:bg-gray-200 rounded"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelect(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          placeholder={placeholder || defaultPlaceholder}
          className="w-full px-3 py-2 text-[15px] text-[#1d1c1d] placeholder:text-[#868686] resize-none focus:outline-none max-h-[200px] leading-[1.46]"
          rows={1}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-0.5">
            {/* Plus menu */}
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPlusMenu(!showPlusMenu); setShowEmojiPicker(false); }}
                className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors"
                title="More options"
              >
                <Plus size={16} />
              </button>
              {showPlusMenu && (
                <div className="absolute bottom-full mb-1 left-0 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-[60] w-48 py-1" data-dropdown>
                  <button
                    onClick={() => { setShowPlusMenu(false); fileInputRef.current?.click(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] text-left"
                  >
                    <Paperclip size={15} className="text-[#616061]" />Upload a file
                  </button>
                  <button
                    onClick={() => { setShowPlusMenu(false); setShowPollCreator(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] text-left"
                  >
                    <BarChart3 size={15} className="text-[#616061]" />Create a poll
                  </button>
                </div>
              )}
            </div>

            {/* File upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors"
              title="Upload file"
            >
              <Paperclip size={16} />
            </button>

            {/* Emoji picker */}
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); setShowPlusMenu(false); }}
                className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors"
                title="Emoji"
              >
                <Smile size={16} />
              </button>
              {showEmojiPicker && (
                <div data-dropdown>
                  <EmojiPickerFull
                    onSelect={(emoji) => { insertAtCursor(emoji); }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Mention */}
            <button
              onClick={() => insertAtCursor("@")}
              className="p-1.5 text-[#616061] hover:text-[#1d1c1d] hover:bg-gray-100 rounded transition-colors"
              title="Mention someone"
            >
              <AtSign size={16} />
            </button>
          </div>

          {/* Send + Schedule */}
          <div className="flex items-center gap-px relative">
            <button
              onClick={handleSend}
              disabled={!hasContent || sending || uploading}
              className={`p-2 rounded-l-lg text-white transition-all ${hasContent ? "bg-[#007a5a] hover:bg-[#006b4f]" : "bg-[#007a5a]/30 cursor-not-allowed"}`}
            >
              <Send size={15} />
            </button>
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => { e.stopPropagation(); if (hasContent) setShowSchedulePicker(!showSchedulePicker); }}
                className={`p-2 rounded-r-lg text-white border-l border-white/20 transition-all ${hasContent ? "bg-[#007a5a] hover:bg-[#006b4f]" : "bg-[#007a5a]/30 cursor-not-allowed"}`}
              >
                <ChevronDown size={12} />
              </button>
              {showSchedulePicker && workspaceId && (
                <SchedulePicker
                  channelId={channelId}
                  workspaceId={workspaceId}
                  content={content}
                  onScheduled={() => { setContent(""); setShowSchedulePicker(false); }}
                  onClose={() => setShowSchedulePicker(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Poll creator modal */}
      {showPollCreator && (
        <PollCreator
          channelId={channelId}
          onClose={() => setShowPollCreator(false)}
          onCreated={() => onMessageSent?.()}
        />
      )}
    </div>
  );
}
