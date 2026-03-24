import { getIO } from "./socket-server";

export function emitToConversation(
  conversationId: string,
  event: string,
  data: any
) {
  getIO().to(`conversation:${conversationId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: any) {
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToWorkspace(
  workspaceId: string,
  event: string,
  data: any
) {
  getIO().to(`workspace:${workspaceId}`).emit(event, data);
}

export function emitToThread(threadId: string, event: string, data: any) {
  getIO().to(`thread:${threadId}`).emit(event, data);
}
