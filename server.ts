import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { initSocketServer } from "./src/realtime/socket-server";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
// In production, bind to 0.0.0.0 so the container is reachable.
// In dev, use localhost to avoid macOS firewall prompts.
const hostname = dev ? "localhost" : "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Health check — responds before Next.js to keep cloud providers happy
    if (req.url === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
      return;
    }
    handle(req, res);
  });

  // CORS: in dev allow localhost, in production allow the configured site URL
  const allowedOrigins = dev
    ? [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
    : process.env.NEXT_PUBLIC_SITE_URL
      ? [process.env.NEXT_PUBLIC_SITE_URL]
      : false;

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins || false,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    // Ping timeout/interval tuning for cloud environments
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  initSocketServer(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
    console.log(`> Socket.io server ready`);

    // Background jobs — process scheduled messages and reminders every 60s
    setInterval(async () => {
      try {
        const { processScheduledMessages } = await import(
          "./src/services/scheduled-message.service"
        );
        await processScheduledMessages();
      } catch {
        // Silent — table may not exist yet
      }
    }, 60_000);

    setInterval(async () => {
      try {
        const { processReminders } = await import(
          "./src/services/reminder.service"
        );
        await processReminders();
      } catch {
        // Silent — table may not exist yet
      }
    }, 60_000);

    console.log(`> Background jobs started (60s interval)`);
  });
});
