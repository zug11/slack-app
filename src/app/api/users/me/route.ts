import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.displayName) updates.displayName = body.displayName;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.timezone) updates.timezone = body.timezone;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(users).set(updates).where(eq(users.id, user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
