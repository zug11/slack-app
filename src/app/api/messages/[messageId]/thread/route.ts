import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMessages } from "@/services/message.service";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAuth();
    const { messageId } = await params;
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const limit = request.nextUrl.searchParams.get("limit")
      ? parseInt(request.nextUrl.searchParams.get("limit")!)
      : 100;

    const supabase = createClient(await cookies());
    const { data: parentMsg } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", messageId)
      .single();

    if (!parentMsg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const result = await getMessages(parentMsg.channel_id, {
      cursor,
      limit,
      threadId: messageId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
