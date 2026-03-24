import { Server as SocketIOServer, Socket } from "socket.io";
import { setOnline, setOffline } from "@/services/presence.service";

export function registerPresenceHandlers(io: SocketIOServer, socket: Socket) {
  const userId = (socket as any).userId;

  // Track explicit status changes
  socket.on(
    "presence:update",
    (data: { workspaceId: string; status: string }) => {
      socket.broadcast.emit("presence:update", {
        userId,
        status: data.status,
      });
    }
  );
}

// Called from socket-server.ts on connect
export async function handlePresenceConnect(
  io: SocketIOServer,
  socket: Socket,
  workspaceIds: string[]
) {
  const userId = (socket as any).userId;

  for (const wid of workspaceIds) {
    try {
      await setOnline(userId, wid);
    } catch {}
    socket.join(`workspace:${wid}`);
    io.to(`workspace:${wid}`).emit("presence:update", {
      userId,
      status: "online",
    });
  }
}

// Called from socket-server.ts on disconnect
export async function handlePresenceDisconnect(
  io: SocketIOServer,
  userId: string,
  workspaceIds: string[]
) {
  for (const wid of workspaceIds) {
    try {
      await setOffline(userId, wid);
    } catch {}
    io.to(`workspace:${wid}`).emit("presence:update", {
      userId,
      status: "offline",
    });
  }
}
