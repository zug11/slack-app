import { db } from "@/db";
import { userPresences } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function setOnline(userId: string, workspaceId: string) {
  const [existing] = await db
    .select({ id: userPresences.id })
    .from(userPresences)
    .where(
      and(
        eq(userPresences.userId, userId),
        eq(userPresences.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(userPresences)
      .set({
        status: "online",
        lastSeenAt: new Date(),
        clientType: "web",
        updatedAt: new Date(),
      })
      .where(eq(userPresences.id, existing.id));
  } else {
    await db.insert(userPresences).values({
      userId,
      workspaceId,
      status: "online",
      lastSeenAt: new Date(),
      clientType: "web",
    });
  }
}

export async function setOffline(userId: string, workspaceId: string) {
  await db
    .update(userPresences)
    .set({
      status: "offline",
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userPresences.userId, userId),
        eq(userPresences.workspaceId, workspaceId)
      )
    );
}

export async function updateStatus(
  userId: string,
  workspaceId: string,
  status: string
) {
  await db
    .update(userPresences)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(userPresences.userId, userId),
        eq(userPresences.workspaceId, workspaceId)
      )
    );
}

export async function getPresences(workspaceId: string) {
  return db
    .select({
      userId: userPresences.userId,
      status: userPresences.status,
      lastSeenAt: userPresences.lastSeenAt,
    })
    .from(userPresences)
    .where(eq(userPresences.workspaceId, workspaceId));
}
