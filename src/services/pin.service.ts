import { db } from "@/db";
import { pinnedMessages, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { emitToConversation } from "@/realtime/emitter";

export async function pinMessage(
  channelId: string,
  messageId: string,
  userId: string
) {
  // Check if already pinned
  const [existing] = await db
    .select({ id: pinnedMessages.id })
    .from(pinnedMessages)
    .where(
      and(
        eq(pinnedMessages.channelId, channelId),
        eq(pinnedMessages.messageId, messageId)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [pin] = await db
    .insert(pinnedMessages)
    .values({ channelId, messageId, pinnedByUserId: userId })
    .returning();

  await db
    .update(messages)
    .set({ isPinned: true })
    .where(eq(messages.id, messageId));

  try {
    emitToConversation(channelId, "message:pinned", { messageId });
  } catch {}

  return pin;
}

export async function unpinMessage(channelId: string, messageId: string) {
  await db
    .delete(pinnedMessages)
    .where(
      and(
        eq(pinnedMessages.channelId, channelId),
        eq(pinnedMessages.messageId, messageId)
      )
    );

  await db
    .update(messages)
    .set({ isPinned: false })
    .where(eq(messages.id, messageId));

  try {
    emitToConversation(channelId, "message:unpinned", { messageId });
  } catch {}
}

export async function getPinnedMessages(channelId: string) {
  return db
    .select()
    .from(pinnedMessages)
    .where(eq(pinnedMessages.channelId, channelId));
}
