import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function findOrCreateDM(
  workspaceId: string,
  userIds: string[]
) {
  const supabase = createClient(await cookies());

  // Check for existing DM between these users
  if (userIds.length === 2) {
    const { data: myMemberships } = await supabase
      .from("direct_message_members")
      .select("dm_channel_id")
      .eq("user_id", userIds[0]);

    for (const row of myMemberships || []) {
      const { data: members } = await supabase
        .from("direct_message_members")
        .select("user_id")
        .eq("dm_channel_id", row.dm_channel_id);

      const memberIds = (members || []).map((m: any) => m.user_id);
      if (
        memberIds.length === 2 &&
        memberIds.includes(userIds[0]) &&
        memberIds.includes(userIds[1])
      ) {
        // Check it's in the right workspace
        const { data: ch } = await supabase
          .from("direct_message_channels")
          .select("*")
          .eq("id", row.dm_channel_id)
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        if (ch) return ch;
      }
    }
  }

  // Create new DM channel
  const type = userIds.length > 2 ? "group_dm" : "dm";
  const { data: channel, error } = await supabase
    .from("direct_message_channels")
    .insert({ workspace_id: workspaceId, type })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("direct_message_members").insert(
    userIds.map((userId) => ({
      dm_channel_id: channel.id,
      user_id: userId,
    }))
  );

  return channel;
}

export async function getUserDMChannels(workspaceId: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: myMemberships } = await supabase
    .from("direct_message_members")
    .select("dm_channel_id")
    .eq("user_id", userId);

  const results = [];
  for (const m of myMemberships || []) {
    const { data: channel } = await supabase
      .from("direct_message_channels")
      .select("*")
      .eq("id", m.dm_channel_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!channel) continue;

    // Get other members with user info
    const { data: members } = await supabase
      .from("direct_message_members")
      .select("user_id, users:user_id(display_name, username, avatar_url)")
      .eq("dm_channel_id", channel.id);

    const otherMembers = (members || [])
      .filter((mm: any) => mm.user_id !== userId)
      .map((mm: any) => ({
        userId: mm.user_id,
        displayName: mm.users?.display_name,
        username: mm.users?.username,
        avatarUrl: mm.users?.avatar_url,
      }));

    results.push({
      ...channel,
      members: otherMembers,
      displayName:
        otherMembers.map((m: any) => m.displayName).join(", ") ||
        "Direct Message",
    });
  }

  return results;
}

export async function sendDM(
  dmChannelId: string,
  userId: string,
  content: string
) {
  const supabase = createClient(await cookies());

  const { data: message, error: insertError } = await supabase
    .from("direct_messages")
    .insert({ dm_channel_id: dmChannelId, user_id: userId, content })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  // Update last_message_at
  await supabase
    .from("direct_message_channels")
    .update({
      last_message_at: message.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dmChannelId);

  // Fetch with user info
  const { data: fullMessage } = await supabase
    .from("direct_messages")
    .select("id, dm_channel_id, user_id, content, type, is_edited, created_at, users:user_id(display_name, username, avatar_url)")
    .eq("id", message.id)
    .single();

  if (!fullMessage) return message;

  return {
    id: fullMessage.id,
    dmChannelId: fullMessage.dm_channel_id,
    userId: fullMessage.user_id,
    content: fullMessage.content,
    type: fullMessage.type,
    isEdited: fullMessage.is_edited,
    createdAt: fullMessage.created_at,
    displayName: (fullMessage.users as any)?.display_name,
    username: (fullMessage.users as any)?.username,
    avatarUrl: (fullMessage.users as any)?.avatar_url,
  };
}

export async function getDMMessages(
  dmChannelId: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const supabase = createClient(await cookies());
  const limit = Math.min(options.limit || 50, 100);

  let query = supabase
    .from("direct_messages")
    .select("id, dm_channel_id, user_id, content, type, is_edited, created_at, users:user_id(display_name, username, avatar_url)")
    .eq("dm_channel_id", dmChannelId)
    .is("deleted_at", null);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  query = query.order("created_at", { ascending: false }).limit(limit + 1);

  const { data: result, error } = await query;

  if (error) throw new Error(error.message);

  const rows = result || [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const mapped = items.map((row: any) => ({
    id: row.id,
    dmChannelId: row.dm_channel_id,
    userId: row.user_id,
    content: row.content,
    type: row.type,
    isEdited: row.is_edited,
    createdAt: row.created_at,
    displayName: row.users?.display_name,
    username: row.users?.username,
    avatarUrl: row.users?.avatar_url,
  }));

  return {
    messages: mapped.reverse(),
    hasMore,
    cursor: mapped.length > 0 ? mapped[0].createdAt : null,
  };
}
