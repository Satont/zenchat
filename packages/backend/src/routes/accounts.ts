import { AccountStore } from "../db/index.ts";
import { requireClient } from "./utils.ts";
import { json } from "./utils.ts";
import type { BunRequest } from "bun";
import type {
  AccountsResponse,
  Platform,
  // @ts-ignore — false positive in tsgo for workspace packages
} from "@twirchat/shared";

export const accountRoutes = {
  "/api/accounts": {
    async GET(req: Request) {
      const auth = await requireClient(req);
      if (auth instanceof Response) return auth;
      const accounts = await AccountStore.findAllByClient(auth.clientSecret);
      return json({
        accounts: accounts.map((a) => ({
          platform: a.platform as Platform,
          username: a.username,
          displayName: a.displayName,
          avatarUrl: a.avatarUrl,
          connectedAt: a.createdAt.getTime(),
        })),
      } satisfies AccountsResponse);
    },
  },

  "/api/accounts/:platform": {
    async DELETE(req: BunRequest<"/api/accounts/:platform">) {
      const auth = await requireClient(req);
      if (auth instanceof Response) return auth;
      const platform = req.params.platform;
      await AccountStore.delete(auth.clientSecret, platform);
      return json({ ok: true });
    },
  },
} as const;
