import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { emitToUser } from "@/realtime/emitter";

interface CreateNotificationInput {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  body?: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}

export async function createNotification(input: CreateNotificationInput) {
  const [notif] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      workspaceId: input.workspaceId,
      type: input.type,
      title: input.title,
      body: input.body,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    })
    .returning();

  try {
    emitToUser(input.userId, "notification:new", notif);
  } catch {}

  return notif;
}

export async function getNotifications(
  userId: string,
  workspaceId: string,
  limit = 50
) {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(
  userId: string,
  workspaceId: string
) {
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.isRead, false)
      )
    );
  return result.length;
}

export async function markNotificationRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsRead(
  userId: string,
  workspaceId: string
) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.isRead, false)
      )
    );
}
