import { db } from "@/db";
import {
  directMessageChannels,
  directMessageMembers,
  directMessages,
  users,
} from "@/db/schema";
import { eq, and, desc, lt, isNull, sql } from "drizzle-orm";
import { emitToUser } from "@/realtime/emitter";

export async function findOrCreateDM(
  workspaceId: string,
  userIds: string[]
) {
  // Check for existing DM between these users
  if (userIds.length === 2) {
    const existing = await db
      .select({ dmChannelId: directMessageMembers.dmChannelId })
      .from(directMessageMembers)
      .where(eq(directMessageMembers.userId, userIds[0]));

    for (const row of existing) {
      const members = await db
        .select({ userId: directMessageMembers.userId })
        .from(directMessageMembers)
        .where(eq(directMessageMembers.dmChannelId, row.dmChannelId));

      const memberIds = members.map((m) => m.userId);
      if (
        memberIds.length === 2 &&
        memberIds.includes(userIds[0]) &&
        memberIds.includes(userIds[1])
      ) {
        // Check it's in the right workspace
        const [ch] = await db
          .select()
          .from(directMessageChannels)
          .where(
            and(
              eq(directMessageChannels.id, row.dmChannelId),
              eq(directMessageChannels.workspaceId, workspaceId)
            )
          )
          .limit(1);
        if (ch) return ch;
      }
    }
  }

  // Create new DM channel
  const type = userIds.length > 2 ? "group_dm" : "dm";
  const [channel] = await db
    .insert(directMessageChannels)
    .values({ workspaceId, type })
    .returning();

  await db.insert(directMessageMembers).values(
    userIds.map((userId) => ({
      dmChannelId: channel.id,
      userId,
    }))
  );

  return channel;
}

export async function getUserDMChannels(workspaceId: string, userId: string) {
  const myMemberships = await db
    .select({ dmChannelId: directMessageMembers.dmChannelId })
    .from(directMessageMembers)
    .where(eq(directMessageMembers.userId, userId));

  const results = [];
  for (const m of myMemberships) {
    const [channel] = await db
      .select()
      .from(directMessageChannels)
      .where(
        and(
          eq(directMessageChannels.id, m.dmChannelId),
          eq(directMessageChannels.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!channel) continue;

    // Get other members
    const members = await db
      .select({
        userId: directMessageMembers.userId,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(directMessageMembers)
      .innerJoin(users, eq(users.id, directMessageMembers.userId))
      .where(eq(directMessageMembers.dmChannelId, channel.id));

    const otherMembers = members.filter((mm) => mm.userId !== userId);

    results.push({
      ...channel,
      members: otherMembers,
      displayName:
        otherMembers.map((m) => m.displayName).join(", ") || "Direct Message",
    });
  }

  return results;
}

export async function sendDM(
  dmChannelId: string,
  userId: string,
  content: string
) {
  const [message] = await db
    .insert(directMessages)
    .values({ dmChannelId, userId, content })
    .returning();

  // Update last_message_at
  await db
    .update(directMessageChannels)
    .set({ lastMessageAt: message.createdAt, updatedAt: new Date() })
    .where(eq(directMessageChannels.id, dmChannelId));

  // Fetch with user info
  const [fullMessage] = await db
    .select({
      id: directMessages.id,
      dmChannelId: directMessages.dmChannelId,
      userId: directMessages.userId,
      content: directMessages.content,
      type: directMessages.type,
      isEdited: directMessages.isEdited,
      createdAt: directMessages.createdAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(directMessages)
    .innerJoin(users, eq(users.id, directMessages.userId))
    .where(eq(directMessages.id, message.id))
    .limit(1);

  // Emit to all members
  const members = await db
    .select({ userId: directMessageMembers.userId })
    .from(directMessageMembers)
    .where(eq(directMessageMembers.dmChannelId, dmChannelId));

  for (const member of members) {
    try {
      emitToUser(member.userId, "dm:new", fullMessage);
    } catch {}
  }

  return fullMessage;
}

export async function getDMMessages(
  dmChannelId: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const limit = Math.min(options.limit || 50, 100);

  const conditions = [
    eq(directMessages.dmChannelId, dmChannelId),
    isNull(directMessages.deletedAt),
  ];

  if (options.cursor) {
    conditions.push(lt(directMessages.createdAt, new Date(options.cursor)));
  }

  const result = await db
    .select({
      id: directMessages.id,
      dmChannelId: directMessages.dmChannelId,
      userId: directMessages.userId,
      content: directMessages.content,
      type: directMessages.type,
      isEdited: directMessages.isEdited,
      createdAt: directMessages.createdAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(directMessages)
    .innerJoin(users, eq(users.id, directMessages.userId))
    .where(and(...conditions))
    .orderBy(desc(directMessages.createdAt))
    .limit(limit + 1);

  const hasMore = result.length > limit;
  const items = hasMore ? result.slice(0, limit) : result;

  return {
    messages: items.reverse(),
    hasMore,
    cursor: items.length > 0 ? items[0].createdAt?.toISOString() : null,
  };
}
