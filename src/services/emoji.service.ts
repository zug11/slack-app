import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";

export async function uploadEmoji(
  workspaceId: string,
  userId: string,
  name: string,
  imageUrl: string,
  isAnimated?: boolean
) {
  const supabase = createClient(await cookies());

  const { data: emoji, error } = await supabase
    .from("emoji_custom")
    .insert({
      workspace_id: workspaceId,
      created_by_user_id: userId,
      name,
      image_url: imageUrl,
      is_animated: isAnimated ?? false,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return emoji;
}

export async function deleteEmoji(id: string) {
  const supabase = createClient(await cookies());

  const { data: deleted, error } = await supabase
    .from("emoji_custom")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error || !deleted) {
    throw new AppError("Emoji not found", 404);
  }

  return deleted;
}

export async function getWorkspaceEmojis(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("emoji_custom")
    .select("id, workspace_id, name, image_url, is_animated, created_by_user_id, created_at, users:created_by_user_id(username, display_name)")
    .eq("workspace_id", workspaceId);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    imageUrl: row.image_url,
    isAnimated: row.is_animated,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    creatorUsername: row.users?.username,
    creatorDisplayName: row.users?.display_name,
  }));
}

export async function searchEmojis(workspaceId: string, query: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("emoji_custom")
    .select("id, workspace_id, name, image_url, is_animated, created_by_user_id, created_at, users:created_by_user_id(username, display_name)")
    .eq("workspace_id", workspaceId)
    .ilike("name", `%${query}%`);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    imageUrl: row.image_url,
    isAnimated: row.is_animated,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    creatorUsername: row.users?.username,
    creatorDisplayName: row.users?.display_name,
  }));
}
