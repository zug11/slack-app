import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { sendMessage } from "@/services/message.service";

export async function scheduleMessage(
  userId: string,
  workspaceId: string,
  channelId: string | null,
  dmChannelId: string | null,
  content: string,
  scheduledAt: Date
) {
  if (!channelId && !dmChannelId) {
    throw new Error("Either channelId or dmChannelId is required");
  }

  const supabase = createClient(await cookies());

  const { data: scheduled, error } = await supabase
    .from("scheduled_messages")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      channel_id: channelId,
      dm_channel_id: dmChannelId,
      content,
      scheduled_at: scheduledAt.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return scheduled;
}

export async function cancelScheduledMessage(id: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: msg } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!msg) {
    throw new Error("Scheduled message not found or already sent/cancelled");
  }

  const { data: updated, error } = await supabase
    .from("scheduled_messages")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return updated;
}

export async function getScheduledMessages(
  userId: string,
  workspaceId: string
) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .order("scheduled_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data || [];
}

export async function processScheduledMessages() {
  const supabase = createClient(await cookies());
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now);

  if (error) throw new Error(error.message);

  const results: { id: string; status: string; error?: string }[] = [];

  for (const msg of due || []) {
    try {
      const targetChannelId = msg.channel_id || msg.dm_channel_id;
      if (!targetChannelId) {
        throw new Error("No target channel for scheduled message");
      }

      await sendMessage({
        channelId: targetChannelId,
        userId: msg.user_id,
        content: msg.content,
      });

      await supabase
        .from("scheduled_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", msg.id);

      results.push({ id: msg.id, status: "sent" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({ id: msg.id, status: "failed", error: errorMessage });
    }
  }

  return results;
}
