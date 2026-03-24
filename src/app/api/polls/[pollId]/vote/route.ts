import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { vote, removeVote } from "@/services/poll.service";
import { handleApiError } from "@/lib/errors";

const voteSchema = z.object({
  optionId: z.uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const user = await requireAuth();
    const { pollId } = await params;
    const body = await request.json();
    const input = voteSchema.parse(body);

    const voteRecord = await vote(pollId, input.optionId, user.id);
    return NextResponse.json({ vote: voteRecord }, { status: 201 });
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
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const user = await requireAuth();
    const { pollId } = await params;
    const body = await request.json();
    const input = voteSchema.parse(body);

    await removeVote(pollId, input.optionId, user.id);
    return NextResponse.json({ success: true });
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
