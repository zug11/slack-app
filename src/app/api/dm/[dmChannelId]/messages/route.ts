import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { sendDM, getDMMessages } from "@/services/dm.service";
import { handleApiError } from "@/lib/errors";

const sendSchema = z.object({
  content: z.string().min(1).max(40000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dmChannelId: string }> }
) {
  try {
    await requireAuth();
    const { dmChannelId } = await params;
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const limit = request.nextUrl.searchParams.get("limit")
      ? parseInt(request.nextUrl.searchParams.get("limit")!)
      : 50;

    const result = await getDMMessages(dmChannelId, { cursor, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dmChannelId: string }> }
) {
  try {
    const user = await requireAuth();
    const { dmChannelId } = await params;
    const body = await request.json();
    const input = sendSchema.parse(body);

    const message = await sendDM(dmChannelId, user.id, input.content);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    return handleApiError(error);
  }
}
