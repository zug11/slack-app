import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { createNotification } from "@/services/notification.service";

export async function createReminder(
  userId: string,
  workspaceId: string,
  messageId: string | null,
  dmMessageId: string | null,
  text: string,
  remindAt: Date
) {
  const [reminder] = await db
    .insert(reminders)
    .values({
      userId,
      workspaceId,
      messageId,
      dmMessageId,
      text,
      remindAt,
      status: "pending",
    })
    .returning();

  return reminder;
}

export async function cancelReminder(id: string, userId: string) {
  const [reminder] = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.id, id),
        eq(reminders.userId, userId),
        eq(reminders.status, "pending")
      )
    )
    .limit(1);

  if (!reminder) {
    throw new Error("Reminder not found or already sent/cancelled");
  }

  const [updated] = await db
    .update(reminders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(reminders.id, id))
    .returning();

  return updated;
}

export async function getReminders(userId: string, workspaceId: string) {
  return db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.userId, userId),
        eq(reminders.workspaceId, workspaceId),
        eq(reminders.status, "pending")
      )
    )
    .orderBy(desc(reminders.remindAt));
}

export async function processReminders() {
  const now = new Date();

  const due = await db
    .select()
    .from(reminders)
    .where(
      and(eq(reminders.status, "pending"), lte(reminders.remindAt, now))
    );

  const results: { id: string; status: string; error?: string }[] = [];

  for (const reminder of due) {
    try {
      await createNotification({
        userId: reminder.userId,
        workspaceId: reminder.workspaceId,
        type: "reminder",
        title: "Reminder",
        body: reminder.text,
        entityType: reminder.messageId ? "message" : undefined,
        entityId: reminder.messageId || undefined,
      });

      await db
        .update(reminders)
        .set({ status: "sent", updatedAt: new Date() })
        .where(eq(reminders.id, reminder.id));

      results.push({ id: reminder.id, status: "sent" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results.push({ id: reminder.id, status: "failed", error: errorMessage });
    }
  }

  return results;
}
