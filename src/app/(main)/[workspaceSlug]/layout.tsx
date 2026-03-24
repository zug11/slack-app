import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import { getWorkspaceChannels } from "@/services/conversation.service";
import { AppShell } from "@/components/layout/app-shell";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const convos = await getWorkspaceChannels(workspace.id, user.id);

  return (
    <AppShell workspace={workspace} conversations={convos}>
      {children}
    </AppShell>
  );
}
