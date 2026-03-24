import { db } from "@/db";
import {
  channels,
  channelMembers,
  directMessageChannels,
  directMessageMembers,
  users,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function createChannel(input: {
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  type?: string;
  isPrivate?: boolean;
  createdByUserId: string;
}) {
  const [channel] = await db
    .insert(channels)
    .values({
      workspaceId: input.workspaceId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      type: input.type || "text",
      isPrivate: input.isPrivate ?? false,
      createdByUserId: input.createdByUserId,
    })
    .returning();

  // Add creator as owner
  await db.insert(channelMembers).values({
    channelId: channel.id,
    userId: input.createdByUserId,
    role: "owner",
  });

  return channel;
}

export async function getWorkspaceChannels(
  workspaceId: string,
  userId: string
) {
  return db
    .select({
      id: channels.id,
      name: channels.name,
      slug: channels.slug,
      description: channels.description,
      topic: channels.topic,
      type: channels.type,
      isPrivate: channels.isPrivate,
      isArchived: channels.isArchived,
      lastMessageAt: channels.lastMessageAt,
      lastReadAt: channelMembers.lastReadAt,
      isMuted: channelMembers.isMuted,
      memberRole: channelMembers.role,
    })
    .from(channels)
    .innerJoin(
      channelMembers,
      and(
        eq(channelMembers.channelId, channels.id),
        eq(channelMembers.userId, userId)
      )
    )
    .where(
      and(
        eq(channels.workspaceId, workspaceId),
        isNull(channels.deletedAt)
      )
    );
}

export async function getChannel(channelId: string) {
  const [channel] = await db
    .select()
    .from(channels)
    .where(and(eq(channels.id, channelId), isNull(channels.deletedAt)))
    .limit(1);

  return channel || null;
}

export async function getChannelMembers(channelId: string) {
  return db
    .select({
      id: channelMembers.id,
      userId: channelMembers.userId,
      role: channelMembers.role,
      joinedAt: channelMembers.joinedAt,
      displayName: users.displayName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(channelMembers)
    .innerJoin(users, eq(users.id, channelMembers.userId))
    .where(eq(channelMembers.channelId, channelId));
}

export async function addChannelMember(channelId: string, userId: string) {
  const [existing] = await db
    .select({ id: channelMembers.id })
    .from(channelMembers)
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      )
    )
    .limit(1);

  if (existing) return;

  await db.insert(channelMembers).values({
    channelId,
    userId,
    role: "member",
  });
}

export async function markChannelRead(
  channelId: string,
  userId: string,
  messageId?: string
) {
  await db
    .update(channelMembers)
    .set({
      lastReadAt: new Date(),
      lastReadMessageId: messageId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      )
    );
}

// DM functions
export async function createDMChannel(
  workspaceId: string,
  userIds: string[],
  type: "dm" | "group_dm" = "dm"
) {
  const [dmChannel] = await db
    .insert(directMessageChannels)
    .values({ workspaceId, type })
    .returning();

  const memberValues = userIds.map((userId) => ({
    dmChannelId: dmChannel.id,
    userId,
  }));

  await db.insert(directMessageMembers).values(memberValues);

  return dmChannel;
}

export async function getUserDMChannels(workspaceId: string, userId: string) {
  return db
    .select({
      id: directMessageChannels.id,
      type: directMessageChannels.type,
      name: directMessageChannels.name,
      lastMessageAt: directMessageChannels.lastMessageAt,
      isMuted: directMessageMembers.isMuted,
      isHidden: directMessageMembers.isHidden,
    })
    .from(directMessageMembers)
    .innerJoin(
      directMessageChannels,
      eq(directMessageChannels.id, directMessageMembers.dmChannelId)
    )
    .where(
      and(
        eq(directMessageMembers.userId, userId),
        eq(directMessageChannels.workspaceId, workspaceId),
        eq(directMessageMembers.isHidden, false)
      )
    );
}
