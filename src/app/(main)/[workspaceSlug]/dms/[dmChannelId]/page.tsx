import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import { getUserDMChannels } from "@/services/dm.service";
import { DMConversationView } from "@/components/messages/dm-conversation-view";

export default async function DMConversationPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; dmChannelId: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { workspaceSlug, dmChannelId } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const dmChannels = await getUserDMChannels(workspace.id, user.id);
  const channel = dmChannels.find((c) => c.id === dmChannelId);
  if (!channel) notFound();

  return <DMConversationView channel={channel} />;
}
