import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { checkPermission } from "@/services/permission.service";
import { PERMISSIONS } from "@/lib/permissions";
import { updateRole, deleteRole } from "@/services/role.service";

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  color: z.string().max(7).optional(),
  isMentionable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; roleId: string }> }
) {
  try {
    const user = await requireAuth();
    const { workspaceId, roleId } = await params;

    const allowed = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.MANAGE_ROLES
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const input = updateRoleSchema.parse(body);

    const role = await updateRole(roleId, {
      name: input.name,
      permissions: input.permissions as any,
      color: input.color,
      isMentionable: input.isMentionable,
      sortOrder: input.sortOrder,
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });
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
  { params }: { params: Promise<{ workspaceId: string; roleId: string }> }
) {
  try {
    const user = await requireAuth();
    const { workspaceId, roleId } = await params;

    const allowed = await checkPermission(
      user.id,
      workspaceId,
      PERMISSIONS.MANAGE_ROLES
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteRole(roleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
