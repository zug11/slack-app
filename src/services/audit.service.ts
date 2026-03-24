import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
  const supabase = createClient(await cookies());

  const { data: log, error } = await supabase
    .from("audit_logs")
    .insert({
      workspace_id: input.workspaceId,
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      changes: input.changes,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

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
  const supabase = createClient(await cookies());
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = supabase
    .from("audit_logs")
    .select("id, workspace_id, actor_user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at, users:actor_user_id(username, display_name, avatar_url)")
    .eq("workspace_id", workspaceId);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.actorUserId) {
    query = query.eq("actor_user_id", filters.actorUserId);
  }
  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    changes: row.changes,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    actorUsername: row.users?.username,
    actorDisplayName: row.users?.display_name,
    actorAvatarUrl: row.users?.avatar_url,
  }));
}
