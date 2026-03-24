import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUnreadCounts } from "@/services/unread.service";
import { handleApiError } from "@/lib/errors";

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
    const unreads = await getUnreadCounts(user.id, workspaceId);
    return NextResponse.json({ unreads });
  } catch (error) {
    return handleApiError(error);
  }
}
