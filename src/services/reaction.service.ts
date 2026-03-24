import { db } from "@/db";
import { messageReactions, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { emitToConversation } from "@/realtime/emitter";

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  const [existing] = await db
    .select({ id: messageReactions.id })
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [reaction] = await db
    .insert(messageReactions)
    .values({ messageId, userId, emoji })
    .returning();

  const [msg] = await db
    .select({ channelId: messages.channelId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (msg) {
    try {
      emitToConversation(msg.channelId, "reaction:added", {
        messageId,
        userId,
        emoji,
        reactionId: reaction.id,
      });
    } catch {}
  }

  return reaction;
}

export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
) {
  await db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    );

  const [msg] = await db
    .select({ channelId: messages.channelId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (msg) {
    try {
      emitToConversation(msg.channelId, "reaction:removed", {
        messageId,
        userId,
        emoji,
      });
    } catch {}
  }
}

export async function getMessageReactions(messageId: string) {
  return db
    .select({
      id: messageReactions.id,
      emoji: messageReactions.emoji,
      userId: messageReactions.userId,
      createdAt: messageReactions.createdAt,
    })
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));
}
