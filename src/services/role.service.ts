import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import type { Permission } from "@/lib/permissions";

export async function createRole(
  workspaceId: string,
  name: string,
  permissions: Permission[],
  color?: string,
  isMentionable?: boolean
) {
  const supabase = createClient(await cookies());

  const { data: role, error } = await supabase
    .from("roles")
    .insert({
      workspace_id: workspaceId,
      name,
      permissions,
      color,
      is_mentionable: isMentionable ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return role;
}

export async function updateRole(
  roleId: string,
  updates: {
    name?: string;
    permissions?: Permission[];
    color?: string;
    isMentionable?: boolean;
    sortOrder?: number;
  }
) {
  const supabase = createClient(await cookies());

  const setValues: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) setValues.name = updates.name;
  if (updates.permissions !== undefined) setValues.permissions = updates.permissions;
  if (updates.color !== undefined) setValues.color = updates.color;
  if (updates.isMentionable !== undefined) setValues.is_mentionable = updates.isMentionable;
  if (updates.sortOrder !== undefined) setValues.sort_order = updates.sortOrder;

  const { data: role, error } = await supabase
    .from("roles")
    .update(setValues)
    .eq("id", roleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return role;
}

export async function deleteRole(roleId: string) {
  const supabase = createClient(await cookies());

  // Delete member-role assignments first
  await supabase.from("member_roles").delete().eq("role_id", roleId);
  await supabase.from("roles").delete().eq("id", roleId);
}

export async function getWorkspaceRoles(workspaceId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function assignRole(
  workspaceMemberId: string,
  roleId: string
) {
  const supabase = createClient(await cookies());

  // Check if already assigned
  const { data: existing } = await supabase
    .from("member_roles")
    .select("id")
    .eq("workspace_member_id", workspaceMemberId)
    .eq("role_id", roleId)
    .maybeSingle();

  if (existing) return existing;

  const { data: assignment, error } = await supabase
    .from("member_roles")
    .insert({ workspace_member_id: workspaceMemberId, role_id: roleId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return assignment;
}

export async function removeRole(
  workspaceMemberId: string,
  roleId: string
) {
  const supabase = createClient(await cookies());

  await supabase
    .from("member_roles")
    .delete()
    .eq("workspace_member_id", workspaceMemberId)
    .eq("role_id", roleId);
}

export async function getMemberRoles(workspaceMemberId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("member_roles")
    .select("roles:role_id(id, name, color, permissions)")
    .eq("workspace_member_id", workspaceMemberId);

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.roles?.id,
    name: row.roles?.name,
    color: row.roles?.color,
    permissions: row.roles?.permissions,
  }));
}
