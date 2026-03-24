import { db } from "@/db";
import { messageReports, users, messages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "@/lib/errors";

export async function reportMessage(
  workspaceId: string,
  reporterUserId: string,
  messageId: string | null,
  dmMessageId: string | null,
  reason: string,
  details?: string
) {
  const [report] = await db
    .insert(messageReports)
    .values({
      workspaceId,
      reporterUserId,
      messageId,
      dmMessageId,
      reason,
      details,
      status: "pending",
    })
    .returning();

  return report;
}

export async function getReports(workspaceId: string, status?: string) {
  const conditions = [eq(messageReports.workspaceId, workspaceId)];

  if (status) {
    conditions.push(eq(messageReports.status, status));
  }

  const reporterUser = {
    reporterUsername: users.username,
    reporterDisplayName: users.displayName,
    reporterAvatarUrl: users.avatarUrl,
  };

  const reports = await db
    .select({
      id: messageReports.id,
      workspaceId: messageReports.workspaceId,
      reporterUserId: messageReports.reporterUserId,
      messageId: messageReports.messageId,
      dmMessageId: messageReports.dmMessageId,
      reason: messageReports.reason,
      details: messageReports.details,
      status: messageReports.status,
      resolvedByUserId: messageReports.resolvedByUserId,
      resolvedAt: messageReports.resolvedAt,
      resolutionNote: messageReports.resolutionNote,
      createdAt: messageReports.createdAt,
      ...reporterUser,
      messageContent: messages.content,
      messageUserId: messages.userId,
    })
    .from(messageReports)
    .leftJoin(users, eq(users.id, messageReports.reporterUserId))
    .leftJoin(messages, eq(messages.id, messageReports.messageId))
    .where(and(...conditions))
    .orderBy(desc(messageReports.createdAt));

  return reports;
}

export async function resolveReport(
  reportId: string,
  resolvedByUserId: string,
  resolutionNote: string
) {
  const [updated] = await db
    .update(messageReports)
    .set({
      status: "resolved",
      resolvedByUserId,
      resolvedAt: new Date(),
      resolutionNote,
      updatedAt: new Date(),
    })
    .where(eq(messageReports.id, reportId))
    .returning();

  if (!updated) {
    throw new AppError("Report not found", 404);
  }

  return updated;
}

export async function dismissReport(
  reportId: string,
  resolvedByUserId: string
) {
  const [updated] = await db
    .update(messageReports)
    .set({
      status: "dismissed",
      resolvedByUserId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(messageReports.id, reportId))
    .returning();

  if (!updated) {
    throw new AppError("Report not found", 404);
  }

  return updated;
}
