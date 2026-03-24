import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function setOnline(userId: string, workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("user_presences")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_presences")
      .update({
        status: "online",
        last_seen_at: new Date().toISOString(),
        client_type: "web",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_presences").insert({
      user_id: userId,
      workspace_id: workspaceId,
      status: "online",
      last_seen_at: new Date().toISOString(),
      client_type: "web",
    });
  }
}

export async function setOffline(userId: string, workspaceId: string) {
  const supabase = createClient(await cookies());

  await supabase
    .from("user_presences")
    .update({
      status: "offline",
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);
}

export async function updateStatus(
  userId: string,
  workspaceId: string,
  status: string
) {
  const supabase = createClient(await cookies());

  await supabase
    .from("user_presences")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);
}

export async function getPresences(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("user_presences")
    .select("user_id, status, last_seen_at")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);

  return data || [];
}
