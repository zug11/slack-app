import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function saveMessage(
  userId: string,
  workspaceId: string,
  messageId: string,
  note?: string
) {
  const supabase = createClient(await cookies());

  // Check if already saved
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing) return existing;

  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      message_id: messageId,
      note,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return bookmark;
}

export async function unsaveMessage(userId: string, messageId: string) {
  const supabase = createClient(await cookies());

  await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("message_id", messageId);
}

export async function getSavedMessages(userId: string, workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("id, message_id, note, created_at, messages:message_id(content, created_at, user_id, channel_id)")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Enrich with author and channel info
  const results = [];
  for (const bk of bookmarks || []) {
    const msg = bk.messages as any;
    if (!msg) continue;

    const { data: author } = await supabase
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", msg.user_id)
      .single();

    const { data: channel } = await supabase
      .from("channels")
      .select("name")
      .eq("id", msg.channel_id)
      .single();

    results.push({
      id: bk.id,
      messageId: bk.message_id,
      note: bk.note,
      createdAt: bk.created_at,
      messageContent: msg.content,
      messageCreatedAt: msg.created_at,
      authorName: author?.display_name,
      authorAvatar: author?.avatar_url,
      channelName: channel?.name,
    });
  }

  return results;
}

export async function isMessageSaved(userId: string, messageId: string) {
  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("message_id", messageId)
    .maybeSingle();

  return !!existing;
}
