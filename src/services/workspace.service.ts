import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { AppError } from "@/lib/errors";

export async function createWorkspace(
  name: string,
  slug: string,
  ownerId: string
) {
  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    throw new AppError("Workspace slug already taken", 409);
  }

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name, slug })
    .select()
    .single();

  if (wsError) throw new AppError(wsError.message, 500);

  // Add owner as member
  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: ownerId,
    role: "owner",
    status: "active",
  });

  // Create default #general channel
  const { data: general, error: chError } = await supabase
    .from("channels")
    .insert({
      workspace_id: workspace.id,
      name: "general",
      slug: "general",
      description: "General discussion",
      type: "text",
      created_by_user_id: ownerId,
    })
    .select()
    .single();

  if (chError) throw new AppError(chError.message, 500);

  // Add owner to general channel
  await supabase.from("channel_members").insert({
    channel_id: general.id,
    user_id: ownerId,
    role: "owner",
  });

  return workspace;
}

export async function getUserWorkspaces(userId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, workspaces:workspace_id(id, name, slug, logo_url, plan)"
    )
    .eq("user_id", userId);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.workspaces.id,
    name: row.workspaces.name,
    slug: row.workspaces.slug,
    logoUrl: row.workspaces.logo_url,
    plan: row.workspaces.plan,
    role: row.role,
  }));
}

export async function getWorkspaceBySlug(slug: string) {
  const supabase = createClient(await cookies());

  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data || null;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, status, joined_at")
    .eq("workspace_id", workspaceId);

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    membershipId: row.id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  }));
}

export async function createWorkspaceInvite(
  workspaceId: string,
  invitedByUserId: string,
  email: string,
  role: string = "member"
) {
  const supabase = createClient(await cookies());

  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      workspace_id: workspaceId,
      invited_by_user_id: invitedByUserId,
      email,
      token,
      expires_at: expiresAt.toISOString(),
      role,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return invite;
}

export async function acceptInvite(token: string, userId: string) {
  const supabase = createClient(await cookies());

  const { data: invite } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    throw new AppError("Invalid or expired invite", 404);
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new AppError("Invite has expired", 410);
  }

  await supabase.from("workspace_members").insert({
    workspace_id: invite.workspace_id,
    user_id: userId,
    role: invite.role,
    status: "active",
    invited_by_user_id: invite.invited_by_user_id,
  });

  await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_by_user_id: userId,
      accepted_at: new Date().toISOString(),
      use_count: (invite.use_count || 0) + 1,
    })
    .eq("id", invite.id);

  return invite.workspace_id;
}
