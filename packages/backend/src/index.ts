import { runMigrations } from "./db/migrations.ts";
import { ClientStore } from "./db/index.ts";
import { handleWsOpen, handleWsClose, handleWsMessage } from "./ws/handlers.ts";
import { authRoutes } from "./routes/auth.ts";
import { accountRoutes } from "./routes/accounts.ts";
import { streamRoutes } from "./routes/stream.ts";
import { webhookRoutes } from "./routes/webhooks.ts";
import { json } from "./routes/utils.ts";
import type { WsData } from "./ws/connection-manager.ts";
import { config } from "./config.ts";

await runMigrations();

const server = Bun.serve<WsData>({
  port: config.PORT,

  routes: {
    ...authRoutes,
    ...accountRoutes,
    ...streamRoutes,
    ...webhookRoutes,
    "/health": () => json({ ok: true }),
  },

  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const secret = req.headers.get("X-Client-Secret");
      if (!secret) {
        return json({ error: "Missing X-Client-Secret" }, 401);
      }
      await ClientStore.upsert(secret);
      const upgraded = server.upgrade(req, { data: { clientSecret: secret } });
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 500 });
      }
      return undefined;
    }

    return json({ error: "Not found" }, 404);
  },

  websocket: {
    open(ws) {
      void handleWsOpen(ws);
    },
    message(ws, message) {
      void handleWsMessage(ws, message);
    },
    close(ws) {
      handleWsClose(ws);
    },
  },
});

console.log(`[Backend] TwirChat backend running on http://localhost:${server.port}`);
console.log(`[Backend] WebSocket endpoint: ws://localhost:${server.port}/ws`);
