import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { handleApiError } from "@/lib/errors";
import { processIncomingWebhook } from "@/services/webhook.service";

const payloadSchema = z.object({
  content: z.string().min(1).max(40000),
  username: z.string().max(80).optional(),
  avatar_url: z.string().url().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const payload = payloadSchema.parse(body);

    const message = await processIncomingWebhook(token, payload);

    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
