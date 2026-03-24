import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import {
  scheduleMessage,
  getScheduledMessages,
} from "@/services/scheduled-message.service";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  workspaceId: z.uuid(),
  channelId: z.uuid().optional(),
  dmChannelId: z.uuid().optional(),
  content: z.string().min(1).max(40000),
  scheduledAt: z.iso.datetime(),
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

    const messages = await getScheduledMessages(user.id, workspaceId);
    return NextResponse.json({ scheduledMessages: messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    if (!input.channelId && !input.dmChannelId) {
      return NextResponse.json(
        { error: "Either channelId or dmChannelId is required" },
        { status: 400 }
      );
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: "scheduledAt must be in the future" },
        { status: 400 }
      );
    }

    const scheduled = await scheduleMessage(
      user.id,
      input.workspaceId,
      input.channelId || null,
      input.dmChannelId || null,
      input.content,
      scheduledAt
    );

    return NextResponse.json({ scheduledMessage: scheduled }, { status: 201 });
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
