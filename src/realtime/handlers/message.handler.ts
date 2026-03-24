import { Server as SocketIOServer, Socket } from "socket.io";

export function registerMessageHandlers(io: SocketIOServer, socket: Socket) {
  // Messages are sent via REST API, not socket.
  // Socket is used to broadcast to other clients.
  // This handler is reserved for future direct-socket message sending.
}
