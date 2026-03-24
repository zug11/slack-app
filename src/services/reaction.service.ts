import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) return existing;

  const { data: reaction, error } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: userId, emoji })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return reaction;
}

export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  const supabase = createClient(await cookies());

  await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji);
}

export async function getMessageReactions(messageId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("message_reactions")
    .select("id, emoji, user_id, created_at")
    .eq("message_id", messageId);

  if (error) throw new Error(error.message);

  return data || [];
}
