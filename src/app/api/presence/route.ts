import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPresences, updateStatus } from "@/services/presence.service";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }
    const presences = await getPresences(workspaceId);
    return NextResponse.json({ presences });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { workspaceId, status } = await request.json();
    if (!workspaceId || !status) {
      return NextResponse.json(
        { error: "workspaceId and status required" },
        { status: 400 }
      );
    }
    await updateStatus(user.id, workspaceId, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
