import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { deleteEmoji } from "@/services/emoji.service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ emojiId: string }> }
) {
  try {
    await requireAuth();
    const { emojiId } = await params;

    await deleteEmoji(emojiId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
