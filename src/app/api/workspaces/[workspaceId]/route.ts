import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
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

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ workspace: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await params;
    const body = await request.json();
    const supabase = createClient(await cookies());

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.settings) updates.settings = body.settings;

    await supabase.from("workspaces").update(updates).eq("id", workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
