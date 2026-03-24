# Scaling Notes

## Socket.io Multi-Instance (Required for 2+ containers)

When running multiple instances behind a load balancer, Socket.io needs shared state.

### 1. Install Redis adapter
```bash
pnpm add @socket.io/redis-adapter redis
```

### 2. Update `src/realtime/socket-server.ts`
```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 3. Load Balancer Config
- **AWS ALB**: Enable "Sticky Sessions" (target group → attributes → stickiness)
- **Railway**: Single instance by default, no LB needed until you scale
- **Nginx**: `ip_hash` or `sticky cookie`

### 4. Environment
Add `REDIS_URL` to your production environment variables.

## Current Architecture (Single Instance)
The app currently runs as a single Node.js process with Socket.io in-memory.
This is fine for up to ~500 concurrent users. Beyond that, add Redis adapter.
