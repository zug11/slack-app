import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMessages } from "@/services/message.service";
import { handleApiError } from "@/lib/errors";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAuth();
    const { messageId } = await params;
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const limit = request.nextUrl.searchParams.get("limit")
      ? parseInt(request.nextUrl.searchParams.get("limit")!)
      : 100;

    const [parentMsg] = await db
      .select({ channelId: messages.channelId })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!parentMsg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const result = await getMessages(parentMsg.channelId, {
      cursor,
      limit,
      threadId: messageId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
