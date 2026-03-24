import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { initSocketServer } from "./src/realtime/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : false,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  initSocketServer(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server ready`);

    // Background jobs — process scheduled messages and reminders every 60s
    setInterval(async () => {
      try {
        const { processScheduledMessages } = await import(
          "./src/services/scheduled-message.service"
        );
        await processScheduledMessages();
      } catch (err) {
        // Silent — scheduled messages table may not exist yet
      }
    }, 60_000);

    setInterval(async () => {
      try {
        const { processReminders } = await import(
          "./src/services/reminder.service"
        );
        await processReminders();
      } catch (err) {
        // Silent — reminders table may not exist yet
      }
    }, 60_000);

    console.log(`> Background jobs started (60s interval)`);
  });
});
