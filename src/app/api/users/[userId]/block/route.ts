import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { blockUser, unblockUser } from "@/services/block.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    const block = await blockUser(user.id, userId);

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    await unblockUser(user.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
