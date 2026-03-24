import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getChannelMembers, addChannelMember } from "@/services/conversation.service";
import { handleApiError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requireAuth();
    const { conversationId } = await params;
    const members = await getChannelMembers(conversationId);
    return NextResponse.json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requireAuth();
    const { conversationId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await addChannelMember(conversationId, userId);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
