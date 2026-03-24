import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";

export async function blockUser(blockerUserId: string, blockedUserId: string) {
  if (blockerUserId === blockedUserId) {
    throw new AppError("Cannot block yourself", 400);
  }

  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("user_blocks")
    .select("*")
    .eq("blocker_user_id", blockerUserId)
    .eq("blocked_user_id", blockedUserId)
    .maybeSingle();

  if (existing) {
    throw new AppError("User already blocked", 409);
  }

  const { data: block, error } = await supabase
    .from("user_blocks")
    .insert({
      blocker_user_id: blockerUserId,
      blocked_user_id: blockedUserId,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return block;
}

export async function unblockUser(
  blockerUserId: string,
  blockedUserId: string
) {
  const supabase = createClient(await cookies());

  const { data: deleted, error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_user_id", blockerUserId)
    .eq("blocked_user_id", blockedUserId)
    .select()
    .single();

  if (error || !deleted) {
    throw new AppError("Block not found", 404);
  }

  return deleted;
}

export async function getBlockedUsers(userId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("user_blocks")
    .select("id, blocked_user_id, created_at, users:blocked_user_id(username, display_name, avatar_url)")
    .eq("blocker_user_id", userId);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.id,
    blockedUserId: row.blocked_user_id,
    createdAt: row.created_at,
    blockedUsername: row.users?.username,
    blockedDisplayName: row.users?.display_name,
    blockedAvatarUrl: row.users?.avatar_url,
  }));
}

export async function isBlocked(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const supabase = createClient(await cookies());

  // Check both directions
  const { data: block1 } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_user_id", userId1)
    .eq("blocked_user_id", userId2)
    .maybeSingle();

  if (block1) return true;

  const { data: block2 } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_user_id", userId2)
    .eq("blocked_user_id", userId1)
    .maybeSingle();

  return !!block2;
}
