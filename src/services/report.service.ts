import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";

export async function reportMessage(
  workspaceId: string,
  reporterUserId: string,
  messageId: string | null,
  dmMessageId: string | null,
  reason: string,
  details?: string
) {
  const supabase = createClient(await cookies());

  const { data: report, error } = await supabase
    .from("message_reports")
    .insert({
      workspace_id: workspaceId,
      reporter_user_id: reporterUserId,
      message_id: messageId,
      dm_message_id: dmMessageId,
      reason,
      details,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);

  return report;
}

export async function getReports(workspaceId: string, status?: string) {
  const supabase = createClient(await cookies());

  let query = supabase
    .from("message_reports")
    .select("id, workspace_id, reporter_user_id, message_id, dm_message_id, reason, details, status, resolved_by_user_id, resolved_at, resolution_note, created_at, users:reporter_user_id(username, display_name, avatar_url), messages:message_id(content, user_id)")
    .eq("workspace_id", workspaceId);

  if (status) {
    query = query.eq("status", status);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 500);

  return (data || []).map((row: any) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    reporterUserId: row.reporter_user_id,
    messageId: row.message_id,
    dmMessageId: row.dm_message_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    resolvedByUserId: row.resolved_by_user_id,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
    reporterUsername: row.users?.username,
    reporterDisplayName: row.users?.display_name,
    reporterAvatarUrl: row.users?.avatar_url,
    messageContent: row.messages?.content,
    messageUserId: row.messages?.user_id,
  }));
}

export async function resolveReport(
  reportId: string,
  resolvedByUserId: string,
  resolutionNote: string
) {
  const supabase = createClient(await cookies());

  const { data: updated, error } = await supabase
    .from("message_reports")
    .update({
      status: "resolved",
      resolved_by_user_id: resolvedByUserId,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("Report not found", 404);
  }

  return updated;
}

export async function dismissReport(
  reportId: string,
  resolvedByUserId: string
) {
  const supabase = createClient(await cookies());

  const { data: updated, error } = await supabase
    .from("message_reports")
    .update({
      status: "dismissed",
      resolved_by_user_id: resolvedByUserId,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError("Report not found", 404);
  }

  return updated;
}
