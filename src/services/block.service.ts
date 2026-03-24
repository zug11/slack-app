import { db } from "@/db";
import { userBlocks, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function blockUser(blockerUserId: string, blockedUserId: string) {
  if (blockerUserId === blockedUserId) {
    throw new AppError("Cannot block yourself", 400);
  }

  const [existing] = await db
    .select()
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerUserId, blockerUserId),
        eq(userBlocks.blockedUserId, blockedUserId)
      )
    )
    .limit(1);

  if (existing) {
    throw new AppError("User already blocked", 409);
  }

  const [block] = await db
    .insert(userBlocks)
    .values({
      blockerUserId,
      blockedUserId,
    })
    .returning();

  return block;
}

export async function unblockUser(
  blockerUserId: string,
  blockedUserId: string
) {
  const [deleted] = await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerUserId, blockerUserId),
        eq(userBlocks.blockedUserId, blockedUserId)
      )
    )
    .returning();

  if (!deleted) {
    throw new AppError("Block not found", 404);
  }

  return deleted;
}

export async function getBlockedUsers(userId: string) {
  const blocks = await db
    .select({
      id: userBlocks.id,
      blockedUserId: userBlocks.blockedUserId,
      createdAt: userBlocks.createdAt,
      blockedUsername: users.username,
      blockedDisplayName: users.displayName,
      blockedAvatarUrl: users.avatarUrl,
    })
    .from(userBlocks)
    .leftJoin(users, eq(users.id, userBlocks.blockedUserId))
    .where(eq(userBlocks.blockerUserId, userId));

  return blocks;
}

export async function isBlocked(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const [block] = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerUserId, userId1),
          eq(userBlocks.blockedUserId, userId2)
        ),
        and(
          eq(userBlocks.blockerUserId, userId2),
          eq(userBlocks.blockedUserId, userId1)
        )
      )
    )
    .limit(1);

  return !!block;
}
