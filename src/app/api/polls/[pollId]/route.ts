import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPollResults } from "@/services/poll.service";
import { handleApiError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    await requireAuth();
    const { pollId } = await params;

    const results = await getPollResults(pollId);
    return NextResponse.json({ poll: results });
  } catch (error) {
    return handleApiError(error);
  }
}
