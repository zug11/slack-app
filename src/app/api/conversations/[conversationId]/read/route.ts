import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markChannelRead } from "@/services/conversation.service";
import { handleApiError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth();
    const { conversationId } = await params;
    const body = await request.json().catch(() => ({}));

    await markChannelRead(conversationId, user.id, body.messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
