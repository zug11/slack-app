import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function createChannel(input: {
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  type?: string;
  isPrivate?: boolean;
  createdByUserId: string;
}) {
  const supabase = createClient(await cookies());

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      type: input.type || "text",
      is_private: input.isPrivate ?? false,
      created_by_user_id: input.createdByUserId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Add creator as owner
  await supabase.from("channel_members").insert({
    channel_id: channel.id,
    user_id: input.createdByUserId,
    role: "owner",
  });

  return channel;
}

export async function getWorkspaceChannels(
  workspaceId: string,
  userId: string
) {
  const supabase = createClient(await cookies());

  // Get channels the user is a member of in this workspace
  const { data: memberships, error: memError } = await supabase
    .from("channel_members")
    .select("channel_id, last_read_at, is_muted, role")
    .eq("user_id", userId);

  if (memError) throw new Error(memError.message);

  const channelIds = (memberships || []).map((m: any) => m.channel_id);
  if (channelIds.length === 0) return [];

  const { data: channels, error: chError } = await supabase
    .from("channels")
    .select("id, name, slug, description, topic, type, is_private, is_archived, last_message_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .in("id", channelIds);

  if (chError) throw new Error(chError.message);

  const memberMap = new Map(
    (memberships || []).map((m: any) => [m.channel_id, m])
  );

  return (channels || []).map((ch: any) => {
    const mem: any = memberMap.get(ch.id) || {};
    return {
      id: ch.id,
      name: ch.name,
      slug: ch.slug,
      description: ch.description,
      topic: ch.topic,
      type: ch.type,
      isPrivate: ch.is_private,
      isArchived: ch.is_archived,
      lastMessageAt: ch.last_message_at,
      lastReadAt: mem.last_read_at,
      isMuted: mem.is_muted,
      memberRole: mem.role,
    };
  });
}

export async function getChannel(channelId: string) {
  const supabase = createClient(await cookies());

  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .is("deleted_at", null)
    .maybeSingle();

  return data || null;
}

export async function getChannelMembers(channelId: string) {
  const supabase = createClient(await cookies());

  const { data: members, error } = await supabase
    .from("channel_members")
    .select("id, user_id, role, joined_at, users:user_id(display_name, username, avatar_url)")
    .eq("channel_id", channelId);

  if (error) throw new Error(error.message);

  return (members || []).map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    displayName: m.users?.display_name,
    username: m.users?.username,
    avatarUrl: m.users?.avatar_url,
  }));
}

export async function addChannelMember(channelId: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  await supabase.from("channel_members").insert({
    channel_id: channelId,
    user_id: userId,
    role: "member",
  });
}

export async function markChannelRead(
  channelId: string,
  userId: string,
  messageId?: string
) {
  const supabase = createClient(await cookies());

  const updates: Record<string, any> = {
    last_read_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (messageId) {
    updates.last_read_message_id = messageId;
  }

  await supabase
    .from("channel_members")
    .update(updates)
    .eq("channel_id", channelId)
    .eq("user_id", userId);
}

// DM functions
export async function createDMChannel(
  workspaceId: string,
  userIds: string[],
  type: "dm" | "group_dm" = "dm"
) {
  const supabase = createClient(await cookies());

  const { data: dmChannel, error } = await supabase
    .from("direct_message_channels")
    .insert({ workspace_id: workspaceId, type })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const memberValues = userIds.map((userId) => ({
    dm_channel_id: dmChannel.id,
    user_id: userId,
  }));

  await supabase.from("direct_message_members").insert(memberValues);

  return dmChannel;
}

export async function getUserDMChannels(workspaceId: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: memberships, error: memError } = await supabase
    .from("direct_message_members")
    .select("dm_channel_id, is_muted, is_hidden")
    .eq("user_id", userId)
    .eq("is_hidden", false);

  if (memError) throw new Error(memError.message);

  const dmChannelIds = (memberships || []).map((m: any) => m.dm_channel_id);
  if (dmChannelIds.length === 0) return [];

  const { data: channels, error: chError } = await supabase
    .from("direct_message_channels")
    .select("id, type, name, last_message_at")
    .eq("workspace_id", workspaceId)
    .in("id", dmChannelIds);

  if (chError) throw new Error(chError.message);

  const memberMap = new Map(
    (memberships || []).map((m: any) => [m.dm_channel_id, m])
  );

  return (channels || []).map((ch: any) => {
    const mem: any = memberMap.get(ch.id) || {};
    return {
      id: ch.id,
      type: ch.type,
      name: ch.name,
      lastMessageAt: ch.last_message_at,
      isMuted: mem.is_muted,
      isHidden: mem.is_hidden,
    };
  });
}
