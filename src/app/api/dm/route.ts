import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { findOrCreateDM, getUserDMChannels } from "@/services/dm.service";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  workspaceId: z.uuid(),
  userIds: z.array(z.uuid()).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }
    const channels = await getUserDMChannels(workspaceId, user.id);
    return NextResponse.json({ channels });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    const allUserIds = [...new Set([user.id, ...input.userIds])];
    const channel = await findOrCreateDM(input.workspaceId, allUserIds);
    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    return handleApiError(error);
  }
}
