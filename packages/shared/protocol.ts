import type { NormalizedChatMessage, NormalizedEvent, Platform, PlatformStatusInfo } from "./types";

/**
 * Протокол WebSocket между backend и desktop-приложением.
 *
 * Desktop подключается к backend с заголовком:
 *   X-Client-Secret: <uuid>
 *
 * Backend пушит сообщения в desktop в виде JSON-объектов BackendToDesktopMessage.
 * Desktop отправляет команды в виде DesktopToBackendMessage.
 */

// ============================================================
// Backend → Desktop
// ============================================================

export type BackendToDesktopMessage =
  | { type: "chat_message"; data: NormalizedChatMessage }
  | { type: "chat_event"; data: NormalizedEvent }
  | { type: "platform_status"; data: PlatformStatusInfo }
  | { type: "auth_url"; platform: Platform; url: string }
  | { type: "auth_success"; platform: Platform; username: string; displayName: string }
  | { type: "auth_error"; platform: Platform; error: string }
  | { type: "error"; message: string }
  | { type: "pong" };

// ============================================================
// Desktop → Backend
// ============================================================

export type DesktopToBackendMessage =
  | { type: "ping" }
  | { type: "auth_start"; platform: Exclude<Platform, "twitch"> }
  | { type: "auth_start_twitch"; codeChallenge: string; state: string }
  | { type: "auth_logout"; platform: Platform }
  | { type: "channel_join"; platform: Platform; channelSlug: string }
  | { type: "channel_leave"; platform: Platform; channelSlug: string }
  | { type: "send_message"; platform: Platform; channelId: string; text: string };

// ============================================================
// HTTP API — запросы от desktop к backend
// ============================================================

/** POST /api/auth/kick/start — получить URL для OAuth */
export interface AuthStartRequest {
  clientSecret: string;
}

export interface AuthStartResponse {
  url: string;
}

/**
 * POST /api/auth/twitch/build-url
 * Desktop отправляет PKCE codeChallenge + state, backend формирует authUrl
 */
export interface TwitchBuildUrlRequest {
  codeChallenge: string;
  state: string;
}

export interface TwitchBuildUrlResponse {
  url: string;
}

/**
 * POST /api/auth/twitch/exchange
 * Desktop получил code из callback, просит backend обменять на токены
 */
export interface TwitchExchangeRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface TwitchExchangeResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
}

/**
 * POST /api/auth/twitch/refresh
 * Desktop просит backend обновить токен
 */
export interface TwitchRefreshRequest {
  refreshToken: string;
}

export interface TwitchRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

// ============================================================
// HTTP API — stream status, update stream, search categories
// ============================================================

/** GET /api/stream-status?platform=twitch|kick&channelId=... */
export interface StreamStatusResponse {
  isLive: boolean;
  title: string;
  categoryId?: string;
  categoryName?: string;
  viewerCount?: number;
}

/** POST /api/update-stream */
export interface UpdateStreamRequest {
  platform: "twitch" | "kick";
  channelId: string;
  /** User access token from the desktop's SQLite */
  userAccessToken: string;
  title?: string;
  categoryId?: string;
}

export interface UpdateStreamResponse {
  ok: boolean;
}

/** GET /api/search-categories?platform=twitch|kick&query=... */
export interface CategorySearchResult {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

export interface SearchCategoriesResponse {
  categories: CategorySearchResult[];
}

// ============================================================

/** GET /api/accounts — список аккаунтов */
export interface AccountsResponse {
  accounts: Array<{
    platform: Platform;
    username: string;
    displayName: string;
    avatarUrl?: string;
    connectedAt: number;
  }>;
}
