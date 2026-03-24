import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import {
  addReaction,
  removeReaction,
  getMessageReactions,
} from "@/services/reaction.service";
import { handleApiError } from "@/lib/errors";

const reactionSchema = z.object({
  emoji: z.string().min(1).max(50),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAuth();
    const { messageId } = await params;
    const reactionsList = await getMessageReactions(messageId);
    return NextResponse.json({ reactions: reactionsList });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const body = await request.json();
    const input = reactionSchema.parse(body);

    const reaction = await addReaction(messageId, user.id, input.emoji);
    return NextResponse.json({ reaction }, { status: 201 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const { emoji } = await request.json();

    await removeReaction(messageId, user.id, emoji);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
