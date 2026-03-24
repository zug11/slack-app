import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getChannel } from "@/services/conversation.service";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import { ConversationView } from "@/components/messages/conversation-view";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; conversationId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { workspaceSlug, conversationId } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const channel = await getChannel(conversationId);
  if (!channel) notFound();

  return (
    <ConversationView
      channel={channel}
      workspace={workspace}
    />
  );
}
