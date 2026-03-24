import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getUnreadCounts(userId: string, workspaceId: string) {
  const supabase = createClient(await cookies());

  // Get all channels the user is a member of in this workspace
  const { data: memberships, error: memError } = await supabase
    .from("channel_members")
    .select("channel_id, last_read_at, channels:channel_id(workspace_id, deleted_at)")
    .eq("user_id", userId);

  if (memError) throw new Error(memError.message);

  // Filter to channels in this workspace that aren't deleted
  const relevantMemberships = (memberships || []).filter((m: any) => {
    return (
      m.channels?.workspace_id === workspaceId && m.channels?.deleted_at === null
    );
  });

  const unreads: Record<string, number> = {};

  for (const row of relevantMemberships) {
    let query = supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", row.channel_id)
      .is("deleted_at", null)
      .is("thread_id", null);

    if (row.last_read_at) {
      query = query.gt("created_at", row.last_read_at);
    }

    const { count } = await query;
    unreads[row.channel_id] = count || 0;
  }

  return unreads;
}
