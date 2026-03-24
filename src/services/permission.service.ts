import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ROLE_DEFAULTS, type Permission } from "@/lib/permissions";

/**
 * Get all permissions for a user in a workspace.
 * Combines: workspace member role defaults + custom roles from member_roles table.
 */
export async function getUserPermissions(
  userId: string,
  workspaceId: string
): Promise<Permission[]> {
  const supabase = createClient(await cookies());

  // Get workspace membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id, role")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!membership) return [];

  // Start with default role permissions
  const basePerms = new Set<Permission>(
    ROLE_DEFAULTS[membership.role] || ROLE_DEFAULTS.member
  );

  // Add custom role permissions from member_roles -> roles
  const { data: customRoles } = await supabase
    .from("member_roles")
    .select("roles:role_id(permissions)")
    .eq("workspace_member_id", membership.id);

  for (const row of customRoles || []) {
    const perms = (row.roles as any)?.permissions as Permission[];
    if (Array.isArray(perms)) {
      for (const p of perms) basePerms.add(p);
    }
  }

  return Array.from(basePerms);
}

/**
 * Check if a user has a specific permission in a workspace.
 */
export async function checkPermission(
  userId: string,
  workspaceId: string,
  permission: Permission
): Promise<boolean> {
  const perms = await getUserPermissions(userId, workspaceId);
  return perms.includes(permission);
}

/**
 * Check channel-level permission overwrites.
 * Overwrites can explicitly allow or deny a permission for a user or role.
 */
export async function hasChannelPermission(
  userId: string,
  channelId: string,
  permission: Permission,
  workspaceId: string
): Promise<boolean> {
  const supabase = createClient(await cookies());

  // First check workspace-level permission
  const hasWorkspacePerm = await checkPermission(
    userId,
    workspaceId,
    permission
  );

  // Check channel-level overwrites for this user
  const { data: userOverwrite } = await supabase
    .from("channel_permission_overwrites")
    .select("allow_permissions, deny_permissions")
    .eq("channel_id", channelId)
    .eq("target_type", "user")
    .eq("target_user_id", userId)
    .maybeSingle();

  if (userOverwrite) {
    const deny = userOverwrite.deny_permissions as string[];
    if (Array.isArray(deny) && deny.includes(permission)) return false;

    const allow = userOverwrite.allow_permissions as string[];
    if (Array.isArray(allow) && allow.includes(permission)) return true;
  }

  // Check role-based overwrites
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (membership) {
    const { data: userRoles } = await supabase
      .from("member_roles")
      .select("role_id")
      .eq("workspace_member_id", membership.id);

    for (const ur of userRoles || []) {
      const { data: roleOverwrite } = await supabase
        .from("channel_permission_overwrites")
        .select("allow_permissions, deny_permissions")
        .eq("channel_id", channelId)
        .eq("target_type", "role")
        .eq("target_role_id", ur.role_id)
        .maybeSingle();

      if (roleOverwrite) {
        const deny = roleOverwrite.deny_permissions as string[];
        if (Array.isArray(deny) && deny.includes(permission)) return false;

        const allow = roleOverwrite.allow_permissions as string[];
        if (Array.isArray(allow) && allow.includes(permission)) return true;
      }
    }
  }

  return hasWorkspacePerm;
}
