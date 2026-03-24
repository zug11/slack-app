import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { db } from "@/db";
import { messages, users, channels } from "@/db/schema";
import { eq, and, sql, ilike, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const query = request.nextUrl.searchParams.get("q");
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "20"),
      50
    );

    if (!query || !workspaceId) {
      return NextResponse.json(
        { error: "q and workspaceId required" },
        { status: 400 }
      );
    }

    const results = await db
      .select({
        id: messages.id,
        channelId: messages.channelId,
        content: messages.content,
        createdAt: messages.createdAt,
        displayName: users.displayName,
        username: users.username,
        channelName: channels.name,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.userId))
      .innerJoin(channels, eq(channels.id, messages.channelId))
      .where(
        and(
          eq(channels.workspaceId, workspaceId),
          isNull(messages.deletedAt),
          ilike(messages.content, `%${query}%`)
        )
      )
      .orderBy(sql`${messages.createdAt} DESC`)
      .limit(limit);

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
