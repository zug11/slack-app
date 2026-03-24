import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const supabase = createClient(await cookies());

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.displayName) updates.display_name = body.displayName;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.timezone) updates.timezone = body.timezone;
    if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl;

    await supabase.from("users").update(updates).eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
