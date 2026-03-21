import { handleStreamStatus } from "../api/stream-status.ts";
import { handleUpdateStream } from "../api/update-stream.ts";
import { handleSearchCategories } from "../api/search-categories.ts";
import { requireClient, json } from "./utils.ts";

export const streamRoutes = {
  "/api/stream-status": {
    async GET(req: Request) {
      const auth = await requireClient(req);
      if (auth instanceof Response) return auth;
      try {
        const status = await handleStreamStatus(new URL(req.url));
        return json(status);
      } catch (err) {
        console.error("[api/stream-status]", err);
        return json({ error: String(err) }, 500);
      }
    },
  },

  "/api/update-stream": {
    async POST(req: Request) {
      const auth = await requireClient(req);
      if (auth instanceof Response) return auth;
      try {
        const result = await handleUpdateStream(req);
        return json(result);
      } catch (err) {
        console.error("[api/update-stream]", err);
        return json({ error: String(err) }, 500);
      }
    },
  },

  "/api/search-categories": {
    async GET(req: Request) {
      const auth = await requireClient(req);
      if (auth instanceof Response) return auth;
      try {
        const result = await handleSearchCategories(new URL(req.url));
        return json(result);
      } catch (err) {
        console.error("[api/search-categories]", err);
        return json({ error: String(err) }, 500);
      }
    },
  },
} as const;
