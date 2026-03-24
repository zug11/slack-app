import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import {
  createReminder,
  getReminders,
} from "@/services/reminder.service";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  workspaceId: z.uuid(),
  messageId: z.uuid().optional(),
  dmMessageId: z.uuid().optional(),
  text: z.string().min(1).max(4000),
  remindAt: z.iso.datetime(),
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

    const reminderList = await getReminders(user.id, workspaceId);
    return NextResponse.json({ reminders: reminderList });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    const remindAt = new Date(input.remindAt);
    if (remindAt <= new Date()) {
      return NextResponse.json(
        { error: "remindAt must be in the future" },
        { status: 400 }
      );
    }

    const reminder = await createReminder(
      user.id,
      input.workspaceId,
      input.messageId || null,
      input.dmMessageId || null,
      input.text,
      remindAt
    );

    return NextResponse.json({ reminder }, { status: 201 });
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
