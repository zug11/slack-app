import { db } from "@/db";
import { channelMembers, messages, channels } from "@/db/schema";
import { eq, and, gt, isNull, sql } from "drizzle-orm";

export async function getUnreadCounts(userId: string, workspaceId: string) {
  // Get all channels the user is a member of in this workspace, with unread counts
  const results = await db
    .select({
      channelId: channelMembers.channelId,
      lastReadAt: channelMembers.lastReadAt,
    })
    .from(channelMembers)
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(
      and(
        eq(channelMembers.userId, userId),
        eq(channels.workspaceId, workspaceId),
        isNull(channels.deletedAt)
      )
    );

  const unreads: Record<string, number> = {};

  for (const row of results) {
    if (!row.lastReadAt) {
      // Never read — count all messages
      const [count] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.channelId, row.channelId),
            isNull(messages.deletedAt),
            isNull(messages.threadId)
          )
        );
      unreads[row.channelId] = count?.count || 0;
    } else {
      // Count messages after last read
      const [count] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.channelId, row.channelId),
            isNull(messages.deletedAt),
            isNull(messages.threadId),
            gt(messages.createdAt, row.lastReadAt)
          )
        );
      unreads[row.channelId] = count?.count || 0;
    }
  }

  return unreads;
}
