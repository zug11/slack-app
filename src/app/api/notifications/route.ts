import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getNotifications,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "@/services/notification.service";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const [notifs, unreadCount] = await Promise.all([
      getNotifications(user.id, workspaceId),
      getUnreadNotificationCount(user.id, workspaceId),
    ]);

    return NextResponse.json({ notifications: notifs, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { workspaceId } = await request.json();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }
    await markAllNotificationsRead(user.id, workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
