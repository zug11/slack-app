import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function pinMessage(
  channelId: string,
  messageId: string,
  userId: string
) {
  const supabase = createClient(await cookies());

  // Check if already pinned
  const { data: existing } = await supabase
    .from("pinned_messages")
    .select("id")
    .eq("channel_id", channelId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing) return existing;

  const { data: pin, error } = await supabase
    .from("pinned_messages")
    .insert({
      channel_id: channelId,
      message_id: messageId,
      pinned_by_user_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("messages")
    .update({ is_pinned: true })
    .eq("id", messageId);

  return pin;
}

export async function unpinMessage(channelId: string, messageId: string) {
  const supabase = createClient(await cookies());

  await supabase
    .from("pinned_messages")
    .delete()
    .eq("channel_id", channelId)
    .eq("message_id", messageId);

  await supabase
    .from("messages")
    .update({ is_pinned: false })
    .eq("id", messageId);
}

export async function getPinnedMessages(channelId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("pinned_messages")
    .select("*")
    .eq("channel_id", channelId);

  if (error) throw new Error(error.message);

  return data || [];
}
