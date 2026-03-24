import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAuth } from "@/lib/auth";
import { createWorkspace, getUserWorkspaces } from "@/services/workspace.service";
import { handleApiError } from "@/lib/errors";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const workspaceList = await getUserWorkspaces(user.id);
    return NextResponse.json({ workspaces: workspaceList });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const input = createSchema.parse(body);

    const workspace = await createWorkspace(input.name, input.slug, user.id);
    return NextResponse.json({ workspace }, { status: 201 });
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
