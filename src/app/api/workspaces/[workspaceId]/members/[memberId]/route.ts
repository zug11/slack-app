import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    await requireAuth();
    const { memberId } = await params;
    const { role } = await request.json();
    const supabase = createClient(await cookies());

    await supabase.from("workspace_members").update({ role, updated_at: new Date().toISOString() }).eq("id", memberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    await requireAuth();
    const { memberId } = await params;
    const supabase = createClient(await cookies());

    await supabase.from("workspace_members").delete().eq("id", memberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
