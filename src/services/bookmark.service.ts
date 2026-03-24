import { db } from "@/db";
import { bookmarks, messages, users, channels } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function saveMessage(
  userId: string,
  workspaceId: string,
  messageId: string,
  note?: string
) {
  // Check if already saved
  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.messageId, messageId))
    )
    .limit(1);

  if (existing) return existing;

  const [bookmark] = await db
    .insert(bookmarks)
    .values({ userId, workspaceId, messageId, note })
    .returning();

  return bookmark;
}

export async function unsaveMessage(userId: string, messageId: string) {
  await db
    .delete(bookmarks)
    .where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.messageId, messageId))
    );
}

export async function getSavedMessages(userId: string, workspaceId: string) {
  return db
    .select({
      id: bookmarks.id,
      messageId: bookmarks.messageId,
      note: bookmarks.note,
      createdAt: bookmarks.createdAt,
      messageContent: messages.content,
      messageCreatedAt: messages.createdAt,
      authorName: users.displayName,
      authorAvatar: users.avatarUrl,
      channelName: channels.name,
    })
    .from(bookmarks)
    .innerJoin(messages, eq(messages.id, bookmarks.messageId))
    .innerJoin(users, eq(users.id, messages.userId))
    .innerJoin(channels, eq(channels.id, messages.channelId))
    .where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.workspaceId, workspaceId))
    )
    .orderBy(desc(bookmarks.createdAt));
}

export async function isMessageSaved(userId: string, messageId: string) {
  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.messageId, messageId))
    )
    .limit(1);

  return !!existing;
}
