import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import { getWorkspaceChannels } from "@/services/conversation.service";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { workspaceSlug } = await params;
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const convos = await getWorkspaceChannels(workspace.id, user.id);

  const generalChannel = convos.find((c) => c.slug === "general");
  const firstChannel = generalChannel || convos[0];

  if (firstChannel) {
    redirect(`/${workspaceSlug}/${firstChannel.id}`);
  }

  return (
    <div className="flex-1 flex items-center justify-center text-muted">
      No channels yet. Create one to get started.
    </div>
  );
}
