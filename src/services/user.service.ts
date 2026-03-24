import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getUserProfile(userId: string) {
  const supabase = createClient(await cookies());

  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, display_name, avatar_url, bio, phone, timezone, locale, is_verified, last_login_at, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    isVerified: user.is_verified,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

export async function updateProfile(
  userId: string,
  updates: {
    displayName?: string;
    bio?: string;
    phone?: string;
    timezone?: string;
    avatarUrl?: string;
  }
) {
  const supabase = createClient(await cookies());

  const setValues: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.displayName !== undefined) setValues.display_name = updates.displayName;
  if (updates.bio !== undefined) setValues.bio = updates.bio;
  if (updates.phone !== undefined) setValues.phone = updates.phone;
  if (updates.timezone !== undefined) setValues.timezone = updates.timezone;
  if (updates.avatarUrl !== undefined) setValues.avatar_url = updates.avatarUrl;

  await supabase.from("users").update(setValues).eq("id", userId);
}

export async function getWorkspaceMembersWithProfiles(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, status, joined_at, users:user_id(display_name, username, avatar_url, email)")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    memberId: row.id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    displayName: row.users?.display_name,
    username: row.users?.username,
    avatarUrl: row.users?.avatar_url,
    email: row.users?.email,
  }));
}
