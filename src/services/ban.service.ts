import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";

export async function banUser(
  workspaceId: string,
  bannedUserId: string,
  bannedByUserId: string,
  reason?: string,
  expiresAt?: Date
) {
  const supabase = createClient(await cookies());

  // Check if already banned
  const { data: existing } = await supabase
    .from("workspace_bans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("banned_user_id", bannedUserId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    throw new AppError("User is already banned", 409);
  }

  // Insert ban
  const { data: ban, error } = await supabase
    .from("workspace_bans")
    .insert({
      workspace_id: workspaceId,
      banned_user_id: bannedUserId,
      banned_by_user_id: bannedByUserId,
      reason,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  // Remove from workspace members
  await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", bannedUserId);

  return ban;
}

export async function unbanUser(workspaceId: string, bannedUserId: string) {
  const supabase = createClient(await cookies());

  const { data: updated, error } = await supabase
    .from("workspace_bans")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("banned_user_id", bannedUserId)
    .eq("is_active", true)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("Ban not found", 404);
  }

  return updated;
}

export async function getBans(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("workspace_bans")
    .select("id, workspace_id, banned_user_id, banned_by_user_id, reason, expires_at, is_active, created_at, users:banned_user_id(username, display_name, avatar_url)")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    bannedUserId: row.banned_user_id,
    bannedByUserId: row.banned_by_user_id,
    reason: row.reason,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    bannedUsername: row.users?.username,
    bannedDisplayName: row.users?.display_name,
    bannedAvatarUrl: row.users?.avatar_url,
  }));
}

export async function isBanned(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient(await cookies());

  const { data: ban } = await supabase
    .from("workspace_bans")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("banned_user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return !!ban;
}

export async function processExpiredBans() {
  const supabase = createClient(await cookies());
  const now = new Date().toISOString();

  const { data: expired, error } = await supabase
    .from("workspace_bans")
    .update({
      is_active: false,
      updated_at: now,
    })
    .eq("is_active", true)
    .lt("expires_at", now)
    .select();

  if (error) throw new Error(error.message);

  return expired || [];
}
