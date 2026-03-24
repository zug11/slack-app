import { db } from "@/db";
import { webhooks, channels, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendMessage } from "@/services/message.service";
import { AppError } from "@/lib/errors";

export async function createWebhook(
  workspaceId: string,
  channelId: string,
  name: string,
  userId: string
) {
  const token = nanoid(32);

  const [webhook] = await db
    .insert(webhooks)
    .values({
      workspaceId,
      channelId,
      name,
      createdByUserId: userId,
      token,
    })
    .returning();

  return webhook;
}

export async function deleteWebhook(id: string) {
  const [deleted] = await db
    .delete(webhooks)
    .where(eq(webhooks.id, id))
    .returning();

  if (!deleted) {
    throw new AppError("Webhook not found", 404);
  }

  return deleted;
}

export async function getWorkspaceWebhooks(workspaceId: string) {
  return db
    .select({
      id: webhooks.id,
      workspaceId: webhooks.workspaceId,
      channelId: webhooks.channelId,
      name: webhooks.name,
      avatarUrl: webhooks.avatarUrl,
      token: webhooks.token,
      isActive: webhooks.isActive,
      createdByUserId: webhooks.createdByUserId,
      createdAt: webhooks.createdAt,
      updatedAt: webhooks.updatedAt,
      creatorUsername: users.username,
      creatorDisplayName: users.displayName,
      channelName: channels.name,
    })
    .from(webhooks)
    .leftJoin(users, eq(users.id, webhooks.createdByUserId))
    .leftJoin(channels, eq(channels.id, webhooks.channelId))
    .where(
      and(
        eq(webhooks.workspaceId, workspaceId),
        eq(webhooks.isActive, true)
      )
    );
}

export async function processIncomingWebhook(
  token: string,
  payload: { content: string; username?: string; avatar_url?: string }
) {
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.token, token), eq(webhooks.isActive, true)))
    .limit(1);

  if (!webhook) {
    throw new AppError("Invalid webhook token", 404);
  }

  if (!webhook.channelId) {
    throw new AppError("Webhook has no channel configured", 400);
  }

  // Update webhook avatar if provided
  if (payload.avatar_url) {
    await db
      .update(webhooks)
      .set({ avatarUrl: payload.avatar_url, updatedAt: new Date() })
      .where(eq(webhooks.id, webhook.id));
  }

  const message = await sendMessage({
    channelId: webhook.channelId,
    userId: webhook.createdByUserId,
    content: payload.content,
    type: "webhook",
  });

  return message;
}

export async function rotateToken(id: string) {
  const newToken = nanoid(32);

  const [updated] = await db
    .update(webhooks)
    .set({
      token: newToken,
      lastRotatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(webhooks.id, id))
    .returning();

  if (!updated) {
    throw new AppError("Webhook not found", 404);
  }

  return updated;
}

export async function updateWebhook(
  id: string,
  data: { name?: string; channelId?: string; isActive?: boolean }
) {
  const [updated] = await db
    .update(webhooks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(webhooks.id, id))
    .returning();

  if (!updated) {
    throw new AppError("Webhook not found", 404);
  }

  return updated;
}
