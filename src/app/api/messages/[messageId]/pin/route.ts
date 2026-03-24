import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { pinMessage, unpinMessage } from "@/services/pin.service";
import { handleApiError } from "@/lib/errors";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;

    const [msg] = await db
      .select({ channelId: messages.channelId })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pin = await pinMessage(msg.channelId, messageId, user.id);
    return NextResponse.json({ pin }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAuth();
    const { messageId } = await params;

    const [msg] = await db
      .select({ channelId: messages.channelId })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await unpinMessage(msg.channelId, messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
