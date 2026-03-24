import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import { reportMessage, getReports } from "@/services/report.service";

const createSchema = z.object({
  workspaceId: z.uuid(),
  messageId: z.uuid().nullable().optional(),
  dmMessageId: z.uuid().nullable().optional(),
  reason: z.enum(['spam', 'harassment', 'hate_speech', 'nsfw', 'misinformation', 'other']),
  details: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const params = request.nextUrl.searchParams;
    const workspaceId = params.get("workspaceId");
    const status = params.get("status") || undefined;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.MANAGE_MEMBERS
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await getReports(workspaceId, status);
    return NextResponse.json({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    const report = await reportMessage(
      input.workspaceId,
      user.id,
      input.messageId ?? null,
      input.dmMessageId ?? null,
      input.reason,
      input.details
    );

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
