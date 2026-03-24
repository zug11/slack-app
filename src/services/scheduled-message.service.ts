import { db } from "@/db";
import { scheduledMessages } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { sendMessage } from "@/services/message.service";

export async function scheduleMessage(
  userId: string,
  workspaceId: string,
  channelId: string | null,
  dmChannelId: string | null,
  content: string,
  scheduledAt: Date
) {
  if (!channelId && !dmChannelId) {
    throw new Error("Either channelId or dmChannelId is required");
  }

  const [scheduled] = await db
    .insert(scheduledMessages)
    .values({
      userId,
      workspaceId,
      channelId,
      dmChannelId,
      content,
      scheduledAt,
      status: "pending",
    })
    .returning();

  return scheduled;
}

export async function cancelScheduledMessage(id: string, userId: string) {
  const [msg] = await db
    .select()
    .from(scheduledMessages)
    .where(
      and(
        eq(scheduledMessages.id, id),
        eq(scheduledMessages.userId, userId),
        eq(scheduledMessages.status, "pending")
      )
    )
    .limit(1);

  if (!msg) {
    throw new Error("Scheduled message not found or already sent/cancelled");
  }

  const [updated] = await db
    .update(scheduledMessages)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(scheduledMessages.id, id))
    .returning();

  return updated;
}

export async function getScheduledMessages(
  userId: string,
  workspaceId: string
) {
  return db
    .select()
    .from(scheduledMessages)
    .where(
      and(
        eq(scheduledMessages.userId, userId),
        eq(scheduledMessages.workspaceId, workspaceId),
        eq(scheduledMessages.status, "pending")
      )
    )
    .orderBy(desc(scheduledMessages.scheduledAt));
}

export async function processScheduledMessages() {
  const now = new Date();

  const due = await db
    .select()
    .from(scheduledMessages)
    .where(
      and(
        eq(scheduledMessages.status, "pending"),
        lte(scheduledMessages.scheduledAt, now)
      )
    );

  const results: { id: string; status: string; error?: string }[] = [];

  for (const msg of due) {
    try {
      const targetChannelId = msg.channelId || msg.dmChannelId;
      if (!targetChannelId) {
        throw new Error("No target channel for scheduled message");
      }

      await sendMessage({
        channelId: targetChannelId,
        userId: msg.userId,
        content: msg.content,
      });

      await db
        .update(scheduledMessages)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(scheduledMessages.id, msg.id));

      results.push({ id: msg.id, status: "sent" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({ id: msg.id, status: "failed", error: errorMessage });
    }
  }

  return results;
}
