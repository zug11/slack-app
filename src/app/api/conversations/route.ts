import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import {
  createChannel,
  getWorkspaceChannels,
} from "@/services/conversation.service";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  workspaceId: z.uuid(),
  type: z.enum(["text", "voice", "video", "announcement", "forum", "stage"]).optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  description: z.string().max(10000).optional(),
  isPrivate: z.boolean().optional(),
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

    const convos = await getWorkspaceChannels(workspaceId, user.id);
    return NextResponse.json({ conversations: convos });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    const conversation = await createChannel({
      workspaceId: input.workspaceId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      type: input.type,
      isPrivate: input.isPrivate,
      createdByUserId: user.id,
    });

    return NextResponse.json({ conversation }, { status: 201 });
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
