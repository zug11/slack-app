import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { createPoll } from "@/services/poll.service";
import { handleApiError } from "@/lib/errors";

const createPollSchema = z.object({
  channelId: z.uuid(),
  question: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(500)).min(2).max(20),
  isAnonymous: z.boolean().optional().default(false),
  isMultipleChoice: z.boolean().optional().default(false),
  expiresAt: z.iso.datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createPollSchema.parse(body);

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

    const poll = await createPoll(
      input.channelId,
      user.id,
      input.question,
      input.options,
      input.isAnonymous,
      input.isMultipleChoice,
      expiresAt
    );

    return NextResponse.json({ poll }, { status: 201 });
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
