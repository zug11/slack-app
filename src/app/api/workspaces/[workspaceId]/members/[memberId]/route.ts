import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "moderator", "member", "guest"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await requireAuth();
    const { workspaceId, memberId } = await params;

    const allowed = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.MANAGE_MEMBERS
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const input = updateMemberSchema.parse(body);

    const [member] = await db
      .update(workspaceMembers)
      .set({ role: input.role, updatedAt: new Date() })
      .where(eq(workspaceMembers.id, memberId))
      .returning();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member });
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
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const user = await requireAuth();
    const { workspaceId, memberId } = await params;

    const allowed = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.MANAGE_MEMBERS
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent kicking the workspace owner
    const [member] = await db
      .select({ role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 400 }
      );
    }

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
