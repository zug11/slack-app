import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface LogActionInput {
  workspaceId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAction(input: LogActionInput) {
  const [log] = await db
    .insert(auditLogs)
    .values({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    })
    .returning();

  return log;
}

interface AuditLogFilters {
  action?: string;
  actorUserId?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(
  workspaceId: string,
  filters?: AuditLogFilters
) {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const conditions = [eq(auditLogs.workspaceId, workspaceId)];

  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters?.actorUserId) {
    conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
  }
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }

  const logs = await db
    .select({
      id: auditLogs.id,
      workspaceId: auditLogs.workspaceId,
      actorUserId: auditLogs.actorUserId,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      changes: auditLogs.changes,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
      actorAvatarUrl: users.avatarUrl,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return logs;
}
