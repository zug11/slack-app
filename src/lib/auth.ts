import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { userSessions, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE = "session";
const SESSION_DURATION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function createSession(userId: string, request?: Request) {
  const token = nanoid(48);
  const refreshToken = nanoid(48);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  let ipAddress =
    request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  // DB constraint requires IP length >= 7; localhost IPv6 "::1" is too short
  if (ipAddress && ipAddress.length < 7) ipAddress = "127.0.0.1";
  const userAgent = request?.headers.get("user-agent") || null;

  await db.insert(userSessions).values({
    userId,
    token,
    refreshToken,
    expiresAt,
    ipAddress,
    userAgent,
    deviceType: "web",
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(userSessions)
    .innerJoin(users, eq(users.id, userSessions.userId))
    .where(
      and(
        eq(userSessions.token, token),
        eq(userSessions.isActive, true),
        gt(userSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return result || null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.token, token));
  }

  cookieStore.delete(SESSION_COOKIE);
}
