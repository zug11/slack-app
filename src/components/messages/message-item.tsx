"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useThreadStore } from "@/stores/thread-store";
import { Avatar } from "@/components/ui/avatar";
import { PollDisplay } from "./poll-display";
import { ReminderPicker } from "./reminder-picker";
import { ReportMessageModal } from "@/components/modals/report-message-modal";
import {
  MessageSquare,
  SmilePlus,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
  Clock,
  Flag,
  Copy,
  X,
} from "lucide-react";

interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string | null;
  type: string;
  threadId: string | null;
  replyCount: number;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  metadata?: any;
}

export function MessageItem({
  message,
  workspaceId,
}: {
  message: Message;
  workspaceId?: string;
}) {
  const user = useCurrentUser();
  const openThread = useThreadStore((s) => s.openThread);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [saved, setSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const isOwn = message.userId === user.id;
  const time = format(new Date(message.createdAt), "h:mm a");

  async function handleEdit() {
    if (!editContent.trim()) return;
    await fetch(`/api/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/messages/${message.id}`, { method: "DELETE" });
  }

  async function handleReaction(emoji: string) {
    await fetch(`/api/messages/${message.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
  }

  async function handleBookmark() {
    if (saved) {
      await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id }),
      });
      setSaved(false);
    } else {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspaceId || "",
          messageId: message.id,
        }),
      });
      setSaved(true);
    }
  }

  async function handlePin() {
    if (message.isPinned) {
      await fetch(`/api/messages/${message.id}/pin`, { method: "DELETE" });
    } else {
      await fetch(`/api/messages/${message.id}/pin`, { method: "POST" });
    }
    setShowMoreMenu(false);
  }

  function handleCopy() {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setShowMoreMenu(false);
  }

  // Render poll instead of text content
  if (message.type === "poll" && message.metadata?.pollId) {
    return (
      <div className="group relative flex gap-2.5 px-5 py-[5px] hover:bg-[#f8f8f8] transition-colors">
        <div className="mt-0.5">
          <Avatar
            displayName={message.displayName}
            avatarUrl={message.avatarUrl}
            userId={message.userId}
            size="md"
            showPresence={true}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[#1d1c1d] text-[15px]">
              {message.displayName}
            </span>
            <span className="text-xs text-[#616061]">{time}</span>
          </div>
          <PollDisplay metadata={message.metadata} />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex gap-2.5 px-5 py-[5px] hover:bg-[#f8f8f8] transition-colors">
      {/* Avatar */}
      <div className="mt-0.5">
        <Avatar
          displayName={message.displayName}
          avatarUrl={message.avatarUrl}
          userId={message.userId}
          size="md"
          showPresence={true}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[#1d1c1d] text-[15px] hover:underline cursor-pointer">
            {message.displayName}
          </span>
          <span className="text-xs text-[#616061]">{time}</span>
          {message.isEdited && (
            <span className="text-xs text-[#616061] italic">(edited)</span>
          )}
          {message.isPinned && (
            <Pin size={12} className="text-[#e8912d]" />
          )}
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-[#1264a3] rounded-lg text-[15px] text-[#1d1c1d] resize-none focus:outline-none focus:ring-1 focus:ring-[#1264a3]"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-[13px] border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-1 text-[13px] bg-[#007a5a] text-white rounded-md hover:bg-[#006b4f]"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[15px] leading-[1.46] text-[#1d1c1d] whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* Thread preview */}
        {message.replyCount > 0 && !editing && (
          <button
            onClick={() => openThread(message.id)}
            className="mt-1 flex items-center gap-1.5 text-[13px] text-[#1264a3] hover:underline"
          >
            <MessageSquare size={14} />
            <span className="font-medium">
              {message.replyCount}{" "}
              {message.replyCount === 1 ? "reply" : "replies"}
            </span>
            <span className="text-[#616061]">View thread</span>
          </button>
        )}
      </div>

      {/* Hover action bar */}
      {!editing && (
        <div className={`absolute -top-3.5 right-5 transition-opacity ${showMoreMenu || showReminder ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"}`}>
          <div className="flex items-center bg-white border border-[#e0e0e0] rounded-lg shadow-sm relative">
            <button
              onClick={() => handleReaction("👍")}
              className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors text-[#616061] hover:text-[#1d1c1d]"
              title="Add reaction"
            >
              <SmilePlus size={16} />
            </button>
            <button
              onClick={() => openThread(message.id)}
              className="p-1.5 hover:bg-gray-100 transition-colors text-[#616061] hover:text-[#1d1c1d]"
              title="Reply in thread"
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={handleBookmark}
              className="p-1.5 hover:bg-gray-100 transition-colors text-[#616061] hover:text-[#1d1c1d]"
              title={saved ? "Remove from saved" : "Save for later"}
            >
              {saved ? (
                <BookmarkCheck size={16} className="text-[#1264a3]" />
              ) : (
                <Bookmark size={16} />
              )}
            </button>
            {isOwn && (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditContent(message.content || "");
                }}
                className="p-1.5 hover:bg-gray-100 transition-colors text-[#616061] hover:text-[#1d1c1d]"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-gray-100 transition-colors text-[#616061] hover:text-[#e01e5a]"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors text-[#616061] hover:text-[#1d1c1d]"
              title="More actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* More dropdown */}
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-50 w-52 py-1">
                <button
                  onClick={handleBookmark}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] text-left"
                >
                  <Bookmark size={15} className="text-[#616061]" />
                  {saved ? "Remove from saved" : "Save message"}
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowReminder(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] text-left"
                >
                  <Clock size={15} className="text-[#616061]" />
                  Remind me
                </button>
                <button
                  onClick={handlePin}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] text-left"
                >
                  <Pin size={15} className="text-[#616061]" />
                  {message.isPinned ? "Unpin message" : "Pin message"}
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#1d1c1d] hover:bg-[#f8f8f8] text-left"
                >
                  <Copy size={15} className="text-[#616061]" />
                  Copy text
                </button>
                <div className="h-px bg-[#e0e0e0] my-1" />
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowReport(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[14px] text-[#e01e5a] hover:bg-[#f8f8f8] text-left"
                >
                  <Flag size={15} />
                  Report message
                </button>
              </div>
            )}
          </div>

          {/* Reminder picker */}
          {showReminder && workspaceId && (
            <ReminderPicker
              messageId={message.id}
              workspaceId={workspaceId}
              onClose={() => setShowReminder(false)}
            />
          )}
        </div>
      )}

      {/* Report modal */}
      {showReport && workspaceId && (
        <ReportMessageModal
          messageId={message.id}
          workspaceId={workspaceId}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
