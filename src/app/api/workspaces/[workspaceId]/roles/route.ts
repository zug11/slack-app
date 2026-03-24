import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import { getWorkspaceRoles, createRole } from "@/services/role.service";

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
  color: z.string().max(7).optional(),
  isMentionable: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await params;

    const roleList = await getWorkspaceRoles(workspaceId);
    return NextResponse.json({ roles: roleList });
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
      PERMISSIONS.MANAGE_ROLES
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const input = createRoleSchema.parse(body);

    const role = await createRole(
      workspaceId,
      input.name,
      input.permissions as any,
      input.color,
      input.isMentionable
    );

    return NextResponse.json({ role }, { status: 201 });
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
