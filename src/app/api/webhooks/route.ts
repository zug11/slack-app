import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import {
  createWebhook,
  getWorkspaceWebhooks,
} from "@/services/webhook.service";

const createSchema = z.object({
  workspaceId: z.uuid(),
  channelId: z.uuid(),
  name: z.string().min(1).max(80),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.MANAGE_WEBHOOKS
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const webhooks = await getWorkspaceWebhooks(workspaceId);
    return NextResponse.json({ webhooks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    const hasPermission = await checkPermission(
      user.id,
      input.workspaceId,
      PERMISSIONS.MANAGE_WEBHOOKS
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const webhook = await createWebhook(
      input.workspaceId,
      input.channelId,
      input.name,
      user.id
    );

    return NextResponse.json({ webhook }, { status: 201 });
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
