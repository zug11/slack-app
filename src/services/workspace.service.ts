import { db } from "@/db";
import {
  workspaces,
  workspaceMembers,
  invitations,
  channels,
  channelMembers,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { AppError } from "@/lib/errors";

export async function createWorkspace(
  name: string,
  slug: string,
  ownerId: string
) {
  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (existing) {
    throw new AppError("Workspace slug already taken", 409);
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({ name, slug })
    .returning();

  // Add owner as member
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: ownerId,
    role: "owner",
    status: "active",
  });

  // Create default #general channel
  const [general] = await db
    .insert(channels)
    .values({
      workspaceId: workspace.id,
      name: "general",
      slug: "general",
      description: "General discussion",
      type: "text",
      createdByUserId: ownerId,
    })
    .returning();

  // Add owner to general channel
  await db.insert(channelMembers).values({
    channelId: general.id,
    userId: ownerId,
    role: "owner",
  });

  return workspace;
}

export async function getUserWorkspaces(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      logoUrl: workspaces.logoUrl,
      plan: workspaces.plan,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));
}

export async function getWorkspaceBySlug(slug: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  return workspace || null;
}

export async function getWorkspaceMembers(workspaceId: string) {
  return db
    .select({
      membershipId: workspaceMembers.id,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}

export async function createWorkspaceInvite(
  workspaceId: string,
  invitedByUserId: string,
  email: string,
  role: string = "member"
) {
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [invite] = await db
    .insert(invitations)
    .values({
      workspaceId,
      invitedByUserId,
      email,
      token,
      expiresAt,
      role,
    })
    .returning();

  return invite;
}

export async function acceptInvite(token: string, userId: string) {
  const [invite] = await db
    .select()
    .from(invitations)
    .where(
      and(eq(invitations.token, token), eq(invitations.status, "pending"))
    )
    .limit(1);

  if (!invite) {
    throw new AppError("Invalid or expired invite", 404);
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new AppError("Invite has expired", 410);
  }

  await db.insert(workspaceMembers).values({
    workspaceId: invite.workspaceId,
    userId,
    role: invite.role,
    status: "active",
    invitedByUserId: invite.invitedByUserId,
  });

  await db
    .update(invitations)
    .set({
      status: "accepted",
      acceptedByUserId: userId,
      acceptedAt: new Date(),
      useCount: (invite.useCount || 0) + 1,
    })
    .where(eq(invitations.id, invite.id));

  return invite.workspaceId;
}
