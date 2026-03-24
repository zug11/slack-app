import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createWorkspaceInvite } from "@/services/workspace.service";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await params;
    const supabase = createClient(await cookies());

    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending");

    return NextResponse.json({ invites: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await requireAuth();
    const { workspaceId } = await params;
    const { email, role } = await request.json();

    const invite = await createWorkspaceInvite(workspaceId, user.id, email, role);
    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
