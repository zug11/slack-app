import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createNotification } from "@/services/notification.service";

export async function createReminder(
  userId: string,
  workspaceId: string,
  messageId: string | null,
  dmMessageId: string | null,
  text: string,
  remindAt: Date
) {
  const supabase = createClient(await cookies());

  const { data: reminder, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      message_id: messageId,
      dm_message_id: dmMessageId,
      text,
      remind_at: remindAt.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return reminder;
}

export async function cancelReminder(id: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: reminder } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!reminder) {
    throw new Error("Reminder not found or already sent/cancelled");
  }

  const { data: updated, error } = await supabase
    .from("reminders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return updated;
}

export async function getReminders(userId: string, workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .order("remind_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data || [];
}

export async function processReminders() {
  const supabase = createClient(await cookies());
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "pending")
    .lte("remind_at", now);

  if (error) throw new Error(error.message);

  const results: { id: string; status: string; error?: string }[] = [];

  for (const reminder of due || []) {
    try {
      await createNotification({
        userId: reminder.user_id,
        workspaceId: reminder.workspace_id,
        type: "reminder",
        title: "Reminder",
        body: reminder.text,
        entityType: reminder.message_id ? "message" : undefined,
        entityId: reminder.message_id || undefined,
      });

      await supabase
        .from("reminders")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", reminder.id);

      results.push({ id: reminder.id, status: "sent" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({ id: reminder.id, status: "failed", error: errorMessage });
    }
  }

  return results;
}
