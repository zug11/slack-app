import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import {
  updateWebhook,
  deleteWebhook,
  rotateToken,
} from "@/services/webhook.service";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  channelId: z.uuid().optional(),
  isActive: z.boolean().optional(),
  rotateToken: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    await requireAuth();
    const { webhookId } = await params;
    const body = await request.json();
    const input = updateSchema.parse(body);

    let webhook;

    if (input.rotateToken) {
      webhook = await rotateToken(webhookId);
    } else {
      const { rotateToken: _, ...updateData } = input;
      webhook = await updateWebhook(webhookId, updateData);
    }

    return NextResponse.json({ webhook });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    await requireAuth();
    const { webhookId } = await params;

    await deleteWebhook(webhookId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
