import { db } from "@/db";
import { messages, channels, users } from "@/db/schema";
import { eq, and, lt, isNull, desc, sql } from "drizzle-orm";
import { emitToConversation, emitToThread } from "@/realtime/emitter";

interface SendMessageInput {
  channelId: string;
  userId: string;
  content: string;
  threadId?: string;
  type?: string;
}

export async function sendMessage(input: SendMessageInput) {
  const [message] = await db
    .insert(messages)
    .values({
      channelId: input.channelId,
      userId: input.userId,
      content: input.content,
      threadId: input.threadId,
      type: input.type || "text",
    })
    .returning();

  // Update channel last_message_at
  await db
    .update(channels)
    .set({
      lastMessageAt: message.createdAt,
      updatedAt: new Date(),
    })
    .where(eq(channels.id, input.channelId));

  // If thread reply, update parent reply count
  if (input.threadId) {
    await db
      .update(messages)
      .set({
        replyCount: sql`${messages.replyCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, input.threadId));
  }

  // Fetch with user info
  const [fullMessage] = await db
    .select({
      id: messages.id,
      channelId: messages.channelId,
      userId: messages.userId,
      content: messages.content,
      type: messages.type,
      threadId: messages.threadId,
      replyCount: messages.replyCount,
      isEdited: messages.isEdited,
      isPinned: messages.isPinned,
      createdAt: messages.createdAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.userId))
    .where(eq(messages.id, message.id))
    .limit(1);

  // Emit real-time event
  try {
    emitToConversation(input.channelId, "message:new", fullMessage);
    if (input.threadId) {
      emitToThread(input.threadId, "message:new", fullMessage);
    }
  } catch {
    // Socket may not be initialized
  }

  return fullMessage;
}

export async function getMessages(
  channelId: string,
  options: {
    cursor?: string;
    limit?: number;
    threadId?: string;
  } = {}
) {
  const limit = Math.min(options.limit || 50, 100);

  const conditions = [
    eq(messages.channelId, channelId),
    isNull(messages.deletedAt),
  ];

  if (options.threadId) {
    conditions.push(eq(messages.threadId, options.threadId));
  } else {
    conditions.push(isNull(messages.threadId));
  }

  if (options.cursor) {
    conditions.push(lt(messages.createdAt, new Date(options.cursor)));
  }

  const result = await db
    .select({
      id: messages.id,
      channelId: messages.channelId,
      userId: messages.userId,
      content: messages.content,
      type: messages.type,
      threadId: messages.threadId,
      replyCount: messages.replyCount,
      isEdited: messages.isEdited,
      isPinned: messages.isPinned,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.userId))
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1);

  const hasMore = result.length > limit;
  const items = hasMore ? result.slice(0, limit) : result;

  return {
    messages: items.reverse(),
    hasMore,
    cursor: items.length > 0 ? items[0].createdAt?.toISOString() : null,
  };
}

export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
) {
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) throw new Error("Message not found");
  if (msg.userId !== userId) throw new Error("Not authorized");

  const [updated] = await db
    .update(messages)
    .set({
      content: newContent,
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(messages.id, messageId))
    .returning();

  try {
    emitToConversation(msg.channelId, "message:updated", updated);
  } catch {}

  return updated;
}

export async function deleteMessage(messageId: string, userId: string) {
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) throw new Error("Message not found");
  if (msg.userId !== userId) throw new Error("Not authorized");

  await db
    .update(messages)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(messages.id, messageId));

  try {
    emitToConversation(msg.channelId, "message:deleted", {
      messageId,
      channelId: msg.channelId,
    });
  } catch {}
}
