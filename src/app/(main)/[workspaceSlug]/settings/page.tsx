"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkspaceGeneral } from "@/components/settings/workspace-general";
import { WorkspaceMembers } from "@/components/settings/workspace-members";
import { RoleManager } from "@/components/settings/role-manager";
import { WebhookManager } from "@/components/settings/webhook-manager";
import { EmojiManager } from "@/components/settings/emoji-manager";
import { AuditLogViewer } from "@/components/settings/audit-log-viewer";
import { BanManager } from "@/components/settings/ban-manager";

type Tab = "general" | "members" | "roles" | "webhooks" | "emoji" | "audit" | "bans";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  settings: Record<string, unknown> | null;
}

export default function SettingsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        // Look up workspace by slug to get the ID
        const res = await fetch("/api/workspaces");
        if (!res.ok) return;
        const data = await res.json();
        const ws = data.workspaces?.find(
          (w: any) => w.slug === workspaceSlug
        );
        if (!ws) return;

        // Fetch full workspace details
        const detailRes = await fetch(`/api/workspaces/${ws.id}`);
        if (!detailRes.ok) return;
        const detailData = await detailRes.json();
        setWorkspace(detailData.workspace);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspace();
  }, [workspaceSlug]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "members", label: "Members" },
    { key: "roles", label: "Roles" },
    { key: "webhooks", label: "Webhooks" },
    { key: "emoji", label: "Emoji" },
    { key: "audit", label: "Audit Log" },
    { key: "bans", label: "Bans" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-[#616061] text-sm">Loading settings...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-[#616061] text-sm">Workspace not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-[#e0e0e0] px-6 py-4">
        <h1 className="text-xl font-bold text-[#1d1c1d]">
          Settings
        </h1>
        <p className="text-sm text-[#616061] mt-0.5">
          Manage your workspace settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#e0e0e0] px-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.key
                    ? "border-[#007a5a] text-[#007a5a]"
                    : "border-transparent text-[#616061] hover:text-[#1d1c1d] hover:border-[#e0e0e0]"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "general" && (
          <WorkspaceGeneral
            workspace={workspace}
            onUpdate={(updated) => setWorkspace(updated)}
          />
        )}
        {activeTab === "members" && (
          <WorkspaceMembers workspaceId={workspace.id} />
        )}
        {activeTab === "roles" && (
          <RoleManager workspaceId={workspace.id} />
        )}
        {activeTab === "webhooks" && (
          <WebhookManager workspaceId={workspace.id} />
        )}
        {activeTab === "emoji" && (
          <EmojiManager workspaceId={workspace.id} />
        )}
        {activeTab === "audit" && (
          <AuditLogViewer workspaceId={workspace.id} />
        )}
        {activeTab === "bans" && (
          <BanManager workspaceId={workspace.id} />
        )}
      </div>
    </div>
  );
}
