import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { cancelScheduledMessage } from "@/services/scheduled-message.service";
import { handleApiError } from "@/lib/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cancelled = await cancelScheduledMessage(id, user.id);
    return NextResponse.json({ scheduledMessage: cancelled });
  } catch (error) {
    return handleApiError(error);
  }
}
