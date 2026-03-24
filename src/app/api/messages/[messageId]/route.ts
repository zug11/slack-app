import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { editMessage, deleteMessage } from "@/services/message.service";
import { handleApiError } from "@/lib/errors";

const editSchema = z.object({
  content: z.string().min(1).max(40000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const body = await request.json();
    const input = editSchema.parse(body);

    const message = await editMessage(messageId, user.id, input.content);
    return NextResponse.json({ message });
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

    await deleteMessage(messageId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
