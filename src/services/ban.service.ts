import { db } from "@/db";
import { workspaceBans, workspaceMembers, users } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function banUser(
  workspaceId: string,
  bannedUserId: string,
  bannedByUserId: string,
  reason?: string,
  expiresAt?: Date
) {
  // Check if already banned
  const [existing] = await db
    .select()
    .from(workspaceBans)
    .where(
      and(
        eq(workspaceBans.workspaceId, workspaceId),
        eq(workspaceBans.bannedUserId, bannedUserId),
        eq(workspaceBans.isActive, true)
      )
    )
    .limit(1);

  if (existing) {
    throw new AppError("User is already banned", 409);
  }

  // Insert ban
  const [ban] = await db
    .insert(workspaceBans)
    .values({
      workspaceId,
      bannedUserId,
      bannedByUserId,
      reason,
      expiresAt,
      isActive: true,
    })
    .returning();

  // Remove from workspace members
  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, bannedUserId)
      )
    );

  return ban;
}

export async function unbanUser(workspaceId: string, bannedUserId: string) {
  const [updated] = await db
    .update(workspaceBans)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workspaceBans.workspaceId, workspaceId),
        eq(workspaceBans.bannedUserId, bannedUserId),
        eq(workspaceBans.isActive, true)
      )
    )
    .returning();

  if (!updated) {
    throw new AppError("Ban not found", 404);
  }

  return updated;
}

export async function getBans(workspaceId: string) {
  return db
    .select({
      id: workspaceBans.id,
      workspaceId: workspaceBans.workspaceId,
      bannedUserId: workspaceBans.bannedUserId,
      bannedByUserId: workspaceBans.bannedByUserId,
      reason: workspaceBans.reason,
      expiresAt: workspaceBans.expiresAt,
      isActive: workspaceBans.isActive,
      createdAt: workspaceBans.createdAt,
      bannedUsername: users.username,
      bannedDisplayName: users.displayName,
      bannedAvatarUrl: users.avatarUrl,
    })
    .from(workspaceBans)
    .leftJoin(users, eq(users.id, workspaceBans.bannedUserId))
    .where(
      and(
        eq(workspaceBans.workspaceId, workspaceId),
        eq(workspaceBans.isActive, true)
      )
    );
}

export async function isBanned(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const [ban] = await db
    .select({ id: workspaceBans.id })
    .from(workspaceBans)
    .where(
      and(
        eq(workspaceBans.workspaceId, workspaceId),
        eq(workspaceBans.bannedUserId, userId),
        eq(workspaceBans.isActive, true)
      )
    )
    .limit(1);

  return !!ban;
}

export async function processExpiredBans() {
  const now = new Date();

  const expired = await db
    .update(workspaceBans)
    .set({
      isActive: false,
      updatedAt: now,
    })
    .where(
      and(
        eq(workspaceBans.isActive, true),
        lt(workspaceBans.expiresAt, now)
      )
    )
    .returning();

  return expired;
}
