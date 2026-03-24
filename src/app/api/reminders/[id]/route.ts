import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { cancelReminder } from "@/services/reminder.service";
import { handleApiError } from "@/lib/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cancelled = await cancelReminder(id, user.id);
    return NextResponse.json({ reminder: cancelled });
  } catch (error) {
    return handleApiError(error);
  }
}
