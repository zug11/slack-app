import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface CreateNotificationInput {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  body?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = createClient(await cookies());

  const { data: notif, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      workspace_id: input.workspaceId,
      type: input.type,
      title: input.title,
      body: input.body,
      actor_user_id: input.actorUserId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return notif;
}

export async function getNotifications(
  userId: string,
  workspaceId: string,
  limit = 50
) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data || [];
}

export async function getUnreadNotificationCount(
  userId: string,
  workspaceId: string
) {
  const supabase = createClient(await cookies());

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);

  return count || 0;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient(await cookies());

  await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead(
  userId: string,
  workspaceId: string
) {
  const supabase = createClient(await cookies());

  await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .eq("is_read", false);
}
