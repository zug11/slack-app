import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWorkspaceMembersWithProfiles } from "@/services/user.service";
import { handleApiError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await params;
    const members = await getWorkspaceMembersWithProfiles(workspaceId);
    return NextResponse.json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}
