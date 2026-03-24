import { Server as SocketIOServer, Socket } from "socket.io";
import { db } from "@/db";
import { userSessions, users, workspaceMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { registerMessageHandlers } from "./handlers/message.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import {
  registerPresenceHandlers,
  handlePresenceConnect,
  handlePresenceDisconnect,
} from "./handlers/presence.handler";

let io: SocketIOServer | null = null;

// Track which workspaces each socket belongs to
const socketWorkspaces = new Map<string, string[]>();

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function initSocketServer(socketIO: SocketIOServer) {
  io = socketIO;

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const sessionToken = parseCookie(cookieHeader, "session");

      if (!sessionToken) {
        return next(new Error("Authentication required"));
      }

      const [session] = await db
        .select({
          sessionId: userSessions.id,
          userId: userSessions.userId,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(userSessions)
        .innerJoin(users, eq(users.id, userSessions.userId))
        .where(
          and(
            eq(userSessions.token, sessionToken),
            eq(userSessions.isActive, true)
          )
        )
        .limit(1);

      if (!session) {
        return next(new Error("Invalid session"));
      }

      (socket as any).userId = session.userId;
      (socket as any).username = session.username;
      (socket as any).displayName = session.displayName;

      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId = (socket as any).userId;
    const displayName = (socket as any).displayName;

    console.log(`User connected: ${displayName} (${userId})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Fetch user's workspaces and join rooms + set presence
    try {
      const memberships = await db
        .select({ workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userId));

      const wids = memberships.map((m) => m.workspaceId);
      socketWorkspaces.set(socket.id, wids);

      await handlePresenceConnect(io!, socket, wids);
    } catch (err) {
      console.error("Error setting up presence:", err);
    }

    // Register event handlers
    registerMessageHandlers(io!, socket);
    registerTypingHandlers(io!, socket);
    registerPresenceHandlers(io!, socket);

    // Conversation room management
    socket.on("join-conversation", (channelId: string) => {
      socket.join(`conversation:${channelId}`);
    });

    socket.on("leave-conversation", (channelId: string) => {
      socket.leave(`conversation:${channelId}`);
    });

    socket.on("join-thread", (threadId: string) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on("leave-thread", (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    // DM room management
    socket.on("join-dm", (dmChannelId: string) => {
      socket.join(`dm:${dmChannelId}`);
    });

    socket.on("leave-dm", (dmChannelId: string) => {
      socket.leave(`dm:${dmChannelId}`);
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${displayName} (${userId})`);
      const wids = socketWorkspaces.get(socket.id) || [];
      socketWorkspaces.delete(socket.id);
      await handlePresenceDisconnect(io!, userId, wids);
    });
  });
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
