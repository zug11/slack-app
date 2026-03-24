import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const query = request.nextUrl.searchParams.get("q");
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 50);

    if (!query || !workspaceId) {
      return NextResponse.json({ error: "q and workspaceId required" }, { status: 400 });
    }

    const supabase = createClient(await cookies());

    // Search messages with ILIKE
    const { data: results, error } = await supabase
      .from("messages")
      .select("id, channel_id, content, created_at, user_id, users:user_id(display_name, username), channels:channel_id(name)")
      .ilike("content", `%${query}%`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (results || []).map((r: any) => ({
      id: r.id,
      channelId: r.channel_id,
      content: r.content,
      createdAt: r.created_at,
      displayName: r.users?.display_name,
      username: r.users?.username,
      channelName: r.channels?.name,
    }));

    return NextResponse.json({ results: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}
