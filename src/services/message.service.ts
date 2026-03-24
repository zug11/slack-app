import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface SendMessageInput {
  channelId: string;
  userId: string;
  content: string;
  threadId?: string;
  type?: string;
}

export async function sendMessage(input: SendMessageInput) {
  const supabase = createClient(await cookies());

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      channel_id: input.channelId,
      user_id: input.userId,
      content: input.content,
      thread_id: input.threadId || null,
      type: input.type || "text",
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  // Update channel last_message_at
  await supabase
    .from("channels")
    .update({
      last_message_at: message.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.channelId);

  // If thread reply, increment parent reply count
  if (input.threadId) {
    // Use rpc or manual increment
    const { data: parent } = await supabase
      .from("messages")
      .select("reply_count")
      .eq("id", input.threadId)
      .single();

    if (parent) {
      await supabase
        .from("messages")
        .update({
          reply_count: (parent.reply_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.threadId);
    }
  }

  // Fetch with user info
  const { data: fullMessage } = await supabase
    .from("messages")
    .select("id, channel_id, user_id, content, type, thread_id, reply_count, is_edited, is_pinned, created_at, users:user_id(display_name, username, avatar_url)")
    .eq("id", message.id)
    .single();

  if (!fullMessage) return message;

  return {
    id: fullMessage.id,
    channelId: fullMessage.channel_id,
    userId: fullMessage.user_id,
    content: fullMessage.content,
    type: fullMessage.type,
    threadId: fullMessage.thread_id,
    replyCount: fullMessage.reply_count,
    isEdited: fullMessage.is_edited,
    isPinned: fullMessage.is_pinned,
    createdAt: fullMessage.created_at,
    displayName: (fullMessage.users as any)?.display_name,
    username: (fullMessage.users as any)?.username,
    avatarUrl: (fullMessage.users as any)?.avatar_url,
  };
}

export async function getMessages(
  channelId: string,
  options: {
    cursor?: string;
    limit?: number;
    threadId?: string;
  } = {}
) {
  const supabase = createClient(await cookies());
  const limit = Math.min(options.limit || 50, 100);

  let query = supabase
    .from("messages")
    .select("id, channel_id, user_id, content, type, thread_id, reply_count, is_edited, is_pinned, created_at, updated_at, users:user_id(display_name, username, avatar_url)")
    .eq("channel_id", channelId)
    .is("deleted_at", null);

  if (options.threadId) {
    query = query.eq("thread_id", options.threadId);
  } else {
    query = query.is("thread_id", null);
  }

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
    channelId: row.channel_id,
    userId: row.user_id,
    content: row.content,
    type: row.type,
    threadId: row.thread_id,
    replyCount: row.reply_count,
    isEdited: row.is_edited,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
) {
  const supabase = createClient(await cookies());

  const { data: msg } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (!msg) throw new Error("Message not found");
  if (msg.user_id !== userId) throw new Error("Not authorized");

  const { data: updated, error } = await supabase
    .from("messages")
    .update({
      content: newContent,
      is_edited: true,
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return updated;
}

export async function deleteMessage(messageId: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: msg } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (!msg) throw new Error("Message not found");
  if (msg.user_id !== userId) throw new Error("Not authorized");

  await supabase
    .from("messages")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);
}
