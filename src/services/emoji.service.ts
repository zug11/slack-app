import { db } from "@/db";
import { emojiCustom, users } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function uploadEmoji(
  workspaceId: string,
  userId: string,
  name: string,
  imageUrl: string,
  isAnimated?: boolean
) {
  const [emoji] = await db
    .insert(emojiCustom)
    .values({
      workspaceId,
      createdByUserId: userId,
      name,
      imageUrl,
      isAnimated: isAnimated ?? false,
    })
    .returning();

  return emoji;
}

export async function deleteEmoji(id: string) {
  const [deleted] = await db
    .delete(emojiCustom)
    .where(eq(emojiCustom.id, id))
    .returning();

  if (!deleted) {
    throw new AppError("Emoji not found", 404);
  }

  return deleted;
}

export async function getWorkspaceEmojis(workspaceId: string) {
  return db
    .select({
      id: emojiCustom.id,
      workspaceId: emojiCustom.workspaceId,
      name: emojiCustom.name,
      imageUrl: emojiCustom.imageUrl,
      isAnimated: emojiCustom.isAnimated,
      createdByUserId: emojiCustom.createdByUserId,
      createdAt: emojiCustom.createdAt,
      creatorUsername: users.username,
      creatorDisplayName: users.displayName,
    })
    .from(emojiCustom)
    .leftJoin(users, eq(users.id, emojiCustom.createdByUserId))
    .where(eq(emojiCustom.workspaceId, workspaceId));
}

export async function searchEmojis(workspaceId: string, query: string) {
  return db
    .select({
      id: emojiCustom.id,
      workspaceId: emojiCustom.workspaceId,
      name: emojiCustom.name,
      imageUrl: emojiCustom.imageUrl,
      isAnimated: emojiCustom.isAnimated,
      createdByUserId: emojiCustom.createdByUserId,
      createdAt: emojiCustom.createdAt,
      creatorUsername: users.username,
      creatorDisplayName: users.displayName,
    })
    .from(emojiCustom)
    .leftJoin(users, eq(users.id, emojiCustom.createdByUserId))
    .where(
      and(
        eq(emojiCustom.workspaceId, workspaceId),
        ilike(emojiCustom.name, `%${query}%`)
      )
    );
}
