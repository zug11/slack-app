import { db } from "@/db";
import {
  workspaceMembers,
  memberRoles,
  roles,
  channelPermissionOverwrites,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ROLE_DEFAULTS, type Permission } from "@/lib/permissions";

/**
 * Get all permissions for a user in a workspace.
 * Combines: workspace member role defaults + custom roles from memberRoles table.
 */
export async function getUserPermissions(
  userId: string,
  workspaceId: string
): Promise<Permission[]> {
  // Get workspace membership
  const [membership] = await db
    .select({ id: workspaceMembers.id, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (!membership) return [];

  // Start with default role permissions
  const basePerms = new Set<Permission>(
    ROLE_DEFAULTS[membership.role] || ROLE_DEFAULTS.member
  );

  // Add custom role permissions from memberRoles → roles
  const customRoles = await db
    .select({ permissions: roles.permissions })
    .from(memberRoles)
    .innerJoin(roles, eq(roles.id, memberRoles.roleId))
    .where(eq(memberRoles.workspaceMemberId, membership.id));

  for (const role of customRoles) {
    const perms = role.permissions as Permission[];
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
  // First check workspace-level permission
  const hasWorkspacePerm = await checkPermission(
    userId,
    workspaceId,
    permission
  );

  // Check channel-level overwrites for this user
  const [userOverwrite] = await db
    .select({
      allowPermissions: channelPermissionOverwrites.allowPermissions,
      denyPermissions: channelPermissionOverwrites.denyPermissions,
    })
    .from(channelPermissionOverwrites)
    .where(
      and(
        eq(channelPermissionOverwrites.channelId, channelId),
        eq(channelPermissionOverwrites.targetType, "user"),
        eq(channelPermissionOverwrites.targetUserId, userId)
      )
    )
    .limit(1);

  if (userOverwrite) {
    const deny = userOverwrite.denyPermissions as string[];
    if (Array.isArray(deny) && deny.includes(permission)) return false;

    const allow = userOverwrite.allowPermissions as string[];
    if (Array.isArray(allow) && allow.includes(permission)) return true;
  }

  // Check role-based overwrites
  const [membership] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (membership) {
    const userRoles = await db
      .select({ roleId: memberRoles.roleId })
      .from(memberRoles)
      .where(eq(memberRoles.workspaceMemberId, membership.id));

    for (const ur of userRoles) {
      const [roleOverwrite] = await db
        .select({
          allowPermissions: channelPermissionOverwrites.allowPermissions,
          denyPermissions: channelPermissionOverwrites.denyPermissions,
        })
        .from(channelPermissionOverwrites)
        .where(
          and(
            eq(channelPermissionOverwrites.channelId, channelId),
            eq(channelPermissionOverwrites.targetType, "role"),
            eq(channelPermissionOverwrites.targetRoleId, ur.roleId)
          )
        )
        .limit(1);

      if (roleOverwrite) {
        const deny = roleOverwrite.denyPermissions as string[];
        if (Array.isArray(deny) && deny.includes(permission)) return false;

        const allow = roleOverwrite.allowPermissions as string[];
        if (Array.isArray(allow) && allow.includes(permission)) return true;
      }
    }
  }

  return hasWorkspacePerm;
}
