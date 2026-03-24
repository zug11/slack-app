import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import {
  saveMessage,
  unsaveMessage,
  getSavedMessages,
} from "@/services/bookmark.service";
import { handleApiError } from "@/lib/errors";

const saveSchema = z.object({
  workspaceId: z.uuid(),
  messageId: z.uuid(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }
    const saved = await getSavedMessages(user.id, workspaceId);
    return NextResponse.json({ bookmarks: saved });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = saveSchema.parse(body);

    const bookmark = await saveMessage(
      user.id,
      input.workspaceId,
      input.messageId,
      input.note
    );
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { messageId } = await request.json();
    if (!messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }
    await unsaveMessage(user.id, messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
