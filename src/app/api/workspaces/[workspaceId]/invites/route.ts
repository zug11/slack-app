import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import { createWorkspaceInvite } from "@/services/workspace.service";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "moderator", "member", "guest"]).default("member"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await params;

    const pendingInvites = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.workspaceId, workspaceId),
          eq(invitations.status, "pending")
        )
      );

    return NextResponse.json({ invites: pendingInvites });
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

    const allowed = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.CREATE_INVITES
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const input = createInviteSchema.parse(body);

    const invite = await createWorkspaceInvite(
      workspaceId,
      user.id,
      input.email,
      input.role
    );

    return NextResponse.json({ invite }, { status: 201 });
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
