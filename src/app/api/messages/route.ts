import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { sendMessage, getMessages } from "@/services/message.service";
import { handleApiError } from "@/lib/errors";

const sendSchema = z.object({
  channelId: z.uuid(),
  content: z.string().min(1).max(40000),
  threadId: z.uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const params = request.nextUrl.searchParams;
    const channelId = params.get("channelId");
    const cursor = params.get("cursor") || undefined;
    const limit = params.get("limit") ? parseInt(params.get("limit")!) : 50;
    const threadId = params.get("threadId") || undefined;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId required" },
        { status: 400 }
      );
    }

    const result = await getMessages(channelId, {
      cursor,
      limit,
      threadId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = sendSchema.parse(body);

    const message = await sendMessage({
      ...input,
      userId: user.id,
    });

    return NextResponse.json({ message }, { status: 201 });
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
