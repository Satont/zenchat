/**
 * GET /api/kick/chatroom?slug=<slug>
 *
 * Resolves a Kick channel slug to its chatroom_id.
 * Uses kick.com/api/v2/channels/{slug} — public, no auth required.
 * The public/v1 API does NOT expose chatroom.id; v2 does.
 */

import { logger } from "../logger.ts";

const log = logger("kick-chatroom");

export interface KickChatroomResponse {
  chatroomId: number;
  channelId: number;
}

export async function handleKickChatroom(url: URL): Promise<KickChatroomResponse> {
  const slug = url.searchParams.get("slug");
  if (!slug) throw new Error("slug query param is required");

  const res = await fetch(
    `https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    log.warn("Kick v2 channels API failed", { slug, status: res.status, body: body.slice(0, 200) });
    throw new Error(`Kick API returned ${res.status} for slug "${slug}"`);
  }

  const body = (await res.json()) as {
    id?: number;
    user_id?: number;
    chatroom?: { id?: number };
  };

  const chatroomId = body.chatroom?.id;
  const channelId = body.id;

  if (!chatroomId) throw new Error(`Kick chatroom.id not found for "${slug}"`);
  if (!channelId) throw new Error(`Kick channel.id not found for "${slug}"`);

  log.debug("Kick chatroom resolved", { slug, chatroomId, channelId });
  return { chatroomId, channelId };
}
