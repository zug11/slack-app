"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Bell,
  Bookmark,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUIStore } from "@/stores/ui-store";
import { useUnreadStore } from "@/stores/unread-store";

interface IconSidebarProps {
  workspaceName: string;
  workspaceSlug: string;
}

const navItems = [
  { id: "home" as const, icon: Home, label: "Home", path: "" },
  { id: "dms" as const, icon: MessageSquare, label: "DMs", path: "/dms" },
  { id: "activity" as const, icon: Bell, label: "Activity", path: "/activity" },
  { id: "later" as const, icon: Bookmark, label: "Later", path: "/later" },
];

export function IconSidebar({ workspaceName, workspaceSlug }: IconSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const { activeNav, setActiveNav } = useUIStore();
  const totalUnread = useUnreadStore((s) => s.getTotalUnread());
  const initial = workspaceName?.charAt(0)?.toUpperCase() || "W";

  function handleNavClick(item: (typeof navItems)[0]) {
    setActiveNav(item.id);
    router.push(`/${workspaceSlug}${item.path}`);
  }

  return (
    <div className="w-[56px] bg-[#1a0321] flex flex-col items-center py-3 shrink-0">
      {/* Workspace icon */}
      <button
        className="w-9 h-9 rounded-xl bg-white/20 text-white font-bold text-sm flex items-center justify-center hover:bg-white/30 transition-colors mb-1"
        onClick={() => {
          setActiveNav("home");
          router.push(`/${workspaceSlug}`);
        }}
      >
        {initial}
      </button>

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-0.5 mt-3">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-colors group relative ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title={item.label}
            >
              <item.icon size={18} />
              <span className="text-[9px] mt-0.5 font-medium leading-none">
                {item.label}
              </span>
              {/* Unread badge on Home */}
              {item.id === "home" && totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#e01e5a] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>
          );
        })}

        {/* Options */}
        <button
          className="w-10 h-10 flex flex-col items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Options"
        >
          <MoreHorizontal size={18} />
          <span className="text-[9px] mt-0.5 font-medium leading-none">
            More
          </span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider */}
      <div className="w-8 h-px bg-white/10 my-2" />

      {/* Create button */}
      <button
        className="w-9 h-9 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors mb-3"
        title="Create"
      >
        <Plus size={18} />
      </button>

      {/* User avatar */}
      <Avatar
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
        userId={user.id}
        size="sm"
        showPresence={true}
        borderColor="sidebar"
      />
    </div>
  );
}
