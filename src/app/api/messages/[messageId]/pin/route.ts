import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { pinMessage, unpinMessage } from "@/services/pin.service";
import { handleApiError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { messageId } = await params;
    const supabase = createClient(await cookies());

    const { data: msg } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", messageId)
      .single();

    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pin = await pinMessage(msg.channel_id, messageId, user.id);
    return NextResponse.json({ pin }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await requireAuth();
    const { messageId } = await params;
    const supabase = createClient(await cookies());

    const { data: msg } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", messageId)
      .single();

    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await unpinMessage(msg.channel_id, messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
