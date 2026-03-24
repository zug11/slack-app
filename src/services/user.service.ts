import { db } from "@/db";
import { users, workspaceMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getUserProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      phone: users.phone,
      timezone: users.timezone,
      locale: users.locale,
      isVerified: users.isVerified,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
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
  const setValues: Record<string, any> = { updatedAt: new Date() };
  if (updates.displayName !== undefined) setValues.displayName = updates.displayName;
  if (updates.bio !== undefined) setValues.bio = updates.bio;
  if (updates.phone !== undefined) setValues.phone = updates.phone;
  if (updates.timezone !== undefined) setValues.timezone = updates.timezone;
  if (updates.avatarUrl !== undefined) setValues.avatarUrl = updates.avatarUrl;

  await db.update(users).set(setValues).where(eq(users.id, userId));
}

export async function getWorkspaceMembersWithProfiles(workspaceId: string) {
  return db
    .select({
      memberId: workspaceMembers.id,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
      joinedAt: workspaceMembers.joinedAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      email: users.email,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}
