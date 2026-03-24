import { db } from "@/db";
import { roles, memberRoles, workspaceMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import type { Permission } from "@/lib/permissions";

export async function createRole(
  workspaceId: string,
  name: string,
  permissions: Permission[],
  color?: string,
  isMentionable?: boolean
) {
  const [role] = await db
    .insert(roles)
    .values({
      workspaceId,
      name,
      permissions,
      color,
      isMentionable: isMentionable ?? true,
    })
    .returning();
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
  const setValues: Record<string, any> = { updatedAt: new Date() };
  if (updates.name !== undefined) setValues.name = updates.name;
  if (updates.permissions !== undefined) setValues.permissions = updates.permissions;
  if (updates.color !== undefined) setValues.color = updates.color;
  if (updates.isMentionable !== undefined) setValues.isMentionable = updates.isMentionable;
  if (updates.sortOrder !== undefined) setValues.sortOrder = updates.sortOrder;

  const [role] = await db
    .update(roles)
    .set(setValues)
    .where(eq(roles.id, roleId))
    .returning();
  return role;
}

export async function deleteRole(roleId: string) {
  // Delete member-role assignments first
  await db.delete(memberRoles).where(eq(memberRoles.roleId, roleId));
  await db.delete(roles).where(eq(roles.id, roleId));
}

export async function getWorkspaceRoles(workspaceId: string) {
  return db
    .select()
    .from(roles)
    .where(eq(roles.workspaceId, workspaceId));
}

export async function assignRole(
  workspaceMemberId: string,
  roleId: string
) {
  // Check if already assigned
  const [existing] = await db
    .select({ id: memberRoles.id })
    .from(memberRoles)
    .where(
      and(
        eq(memberRoles.workspaceMemberId, workspaceMemberId),
        eq(memberRoles.roleId, roleId)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [assignment] = await db
    .insert(memberRoles)
    .values({ workspaceMemberId, roleId })
    .returning();
  return assignment;
}

export async function removeRole(
  workspaceMemberId: string,
  roleId: string
) {
  await db
    .delete(memberRoles)
    .where(
      and(
        eq(memberRoles.workspaceMemberId, workspaceMemberId),
        eq(memberRoles.roleId, roleId)
      )
    );
}

export async function getMemberRoles(workspaceMemberId: string) {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      color: roles.color,
      permissions: roles.permissions,
    })
    .from(memberRoles)
    .innerJoin(roles, eq(roles.id, memberRoles.roleId))
    .where(eq(memberRoles.workspaceMemberId, workspaceMemberId));
}
