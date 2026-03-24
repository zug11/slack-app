import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import {
  uploadEmoji,
  getWorkspaceEmojis,
  searchEmojis,
} from "@/services/emoji.service";

const createSchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().min(1).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  imageUrl: z.string().url(),
  isAnimated: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const query = request.nextUrl.searchParams.get("q");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const emojis = query
      ? await searchEmojis(workspaceId, query)
      : await getWorkspaceEmojis(workspaceId);

    return NextResponse.json({ emojis });
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
      PERMISSIONS.MANAGE_EMOJI
    );
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emoji = await uploadEmoji(
      input.workspaceId,
      user.id,
      input.name,
      input.imageUrl,
      input.isAnimated
    );

    return NextResponse.json({ emoji }, { status: 201 });
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
