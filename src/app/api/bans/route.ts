import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { banUser, getBans } from "@/services/ban.service";

const createBanSchema = z.object({
  workspaceId: z.uuid(),
  bannedUserId: z.uuid(),
  reason: z.string().max(500).optional(),
  expiresAt: z.iso.datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const bans = await getBans(workspaceId);
    return NextResponse.json({ bans });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createBanSchema.parse(body);

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

    const ban = await banUser(
      input.workspaceId,
      input.bannedUserId,
      user.id,
      input.reason,
      expiresAt
    );

    return NextResponse.json({ ban }, { status: 201 });
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
