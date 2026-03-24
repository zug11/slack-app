import { Server as SocketIOServer, Socket } from "socket.io";

export function registerTypingHandlers(io: SocketIOServer, socket: Socket) {
  const userId = (socket as any).userId;
  const displayName = (socket as any).displayName;

  socket.on("typing:start", (data: { conversationId: string; threadRootId?: string }) => {
    const room = data.threadRootId
      ? `thread:${data.threadRootId}`
      : `conversation:${data.conversationId}`;

    socket.to(room).emit("typing:start", {
      conversationId: data.conversationId,
      threadRootId: data.threadRootId,
      userId,
      displayName,
    });
  });

  socket.on("typing:stop", (data: { conversationId: string; threadRootId?: string }) => {
    const room = data.threadRootId
      ? `thread:${data.threadRootId}`
      : `conversation:${data.conversationId}`;

    socket.to(room).emit("typing:stop", {
      conversationId: data.conversationId,
      threadRootId: data.threadRootId,
      userId,
    });
  });
}
