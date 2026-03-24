import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import { getAuditLogs } from "@/services/audit.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const params = request.nextUrl.searchParams;
    const workspaceId = params.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.VIEW_AUDIT_LOG
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const action = params.get("action") || undefined;
    const actorUserId = params.get("actorUserId") || undefined;
    const entityType = params.get("entityType") || undefined;
    const limit = params.get("limit") ? parseInt(params.get("limit")!) : 50;
    const offset = params.get("offset") ? parseInt(params.get("offset")!) : 0;

    const logs = await getAuditLogs(workspaceId, {
      action,
      actorUserId,
      entityType,
      limit,
      offset,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}
