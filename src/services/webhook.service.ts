import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { sendMessage } from "@/services/message.service";
import { AppError } from "@/lib/errors";

export async function createWebhook(
  workspaceId: string,
  channelId: string,
  name: string,
  userId: string
) {
  const supabase = createClient(await cookies());
  const token = nanoid(32);

  const { data: webhook, error } = await supabase
    .from("webhooks")
    .insert({
      workspace_id: workspaceId,
      channel_id: channelId,
      name,
      created_by_user_id: userId,
      token,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return webhook;
}

export async function deleteWebhook(id: string) {
  const supabase = createClient(await cookies());

  const { data: deleted, error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error || !deleted) {
    throw new AppError("Webhook not found", 404);
  }

  return deleted;
}

export async function getWorkspaceWebhooks(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("webhooks")
    .select("id, workspace_id, channel_id, name, avatar_url, token, is_active, created_by_user_id, created_at, updated_at, users:created_by_user_id(username, display_name), channels:channel_id(name)")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    channelId: row.channel_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    token: row.token,
    isActive: row.is_active,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    creatorUsername: row.users?.username,
    creatorDisplayName: row.users?.display_name,
    channelName: row.channels?.name,
  }));
}

export async function processIncomingWebhook(
  token: string,
  payload: { content: string; username?: string; avatar_url?: string }
) {
  const supabase = createClient(await cookies());

  const { data: webhook } = await supabase
    .from("webhooks")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!webhook) {
    throw new AppError("Invalid webhook token", 404);
  }

  if (!webhook.channel_id) {
    throw new AppError("Webhook has no channel configured", 400);
  }

  // Update webhook avatar if provided
  if (payload.avatar_url) {
    await supabase
      .from("webhooks")
      .update({
        avatar_url: payload.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhook.id);
  }

  const message = await sendMessage({
    channelId: webhook.channel_id,
    userId: webhook.created_by_user_id,
    content: payload.content,
    type: "webhook",
  });

  return message;
}

export async function rotateToken(id: string) {
  const supabase = createClient(await cookies());
  const newToken = nanoid(32);

  const { data: updated, error } = await supabase
    .from("webhooks")
    .update({
      token: newToken,
      last_rotated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("Webhook not found", 404);
  }

  return updated;
}

export async function updateWebhook(
  id: string,
  data: { name?: string; channelId?: string; isActive?: boolean }
) {
  const supabase = createClient(await cookies());

  const setValues: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) setValues.name = data.name;
  if (data.channelId !== undefined) setValues.channel_id = data.channelId;
  if (data.isActive !== undefined) setValues.is_active = data.isActive;

  const { data: updated, error } = await supabase
    .from("webhooks")
    .update(setValues)
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("Webhook not found", 404);
  }

  return updated;
}
