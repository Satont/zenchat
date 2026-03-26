/**
 * Kick OAuth — desktop side.
 *
 * Auth flow (initiation + callback) is handled entirely by the backend:
 *  1. Desktop sends `auth_start` { platform: "kick" } over WS → backend builds OAuth URL
 *  2. Backend returns `auth_url` over WS → desktop opens browser
 *  3. Kick redirects to backend callback URL (http://localhost:3000/auth/kick/callback)
 *  4. Backend exchanges code, stores account in Postgres, pushes `auth_success` over WS
 *  5. Desktop receives `auth_success` → App.vue updates UI
 *
 * Token refresh is delegated to the backend via POST /api/auth/kick/refresh.
 */

import { AccountStore } from "../store/account-store";
import { BACKEND_URL } from "@twirchat/shared/constants";
import type { KickRefreshRequest, KickRefreshResponse } from "@twirchat/shared";

/**
 * Refreshes the Kick access token for the given accountId via the backend proxy.
 * Updates the stored tokens in SQLite and returns the new access token.
 */
export async function refreshKickToken(accountId: string): Promise<string> {
  const stored = AccountStore.getTokens(accountId);
  if (!stored?.refreshToken) {
    throw new Error("No refresh token for Kick account");
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/kick/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken: stored.refreshToken,
    } satisfies KickRefreshRequest),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kick token refresh failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as KickRefreshResponse;

  const expiresAt = data.expiresIn
    ? Math.floor(Date.now() / 1000) + data.expiresIn
    : undefined;

  AccountStore.updateTokens(
    accountId,
    data.accessToken,
    data.refreshToken,
    expiresAt,
  );

  return data.accessToken;
}
