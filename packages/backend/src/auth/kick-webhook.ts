import { createHmac } from 'node:crypto'
import type { Badge, NormalizedChatMessage, NormalizedEvent } from '@twirchat/shared'
import { connectionManager } from '../ws/connection-manager.ts'
import { config } from '../config.ts'

// ============================================================
// Kick webhook payload types (v1)
// ============================================================

interface KickUser {
  is_anonymous: boolean
  user_id: number | null
  username: string | null
  is_verified: boolean | null
  profile_picture: string | null
  channel_slug: string | null
  identity: {
    username_color?: string
    badges?: { text: string; type: string; count?: number }[]
  } | null
}

interface ChatMessagePayload {
  message_id: string
  broadcaster: KickUser
  sender: KickUser
  content: string
  emotes: {
    emote_id: string
    positions: Array<{ s: number; e: number }>
  }[]
  created_at: string
}

interface ChannelFollowPayload {
  broadcaster: KickUser
  follower: KickUser
}

interface ChannelSubscriptionPayload {
  broadcaster: KickUser
  subscriber: KickUser
  duration: number
  created_at: string
  expires_at: string
}

interface ChannelSubscriptionGiftsPayload {
  broadcaster: KickUser
  gifter: KickUser
  giftees: KickUser[]
  created_at: string
}

// ============================================================
// HMAC signature verification
// ============================================================

export async function verifyKickSignature(req: Request, body: string): Promise<boolean> {
  if (!config.KICK_WEBHOOK_SECRET) {
    console.warn('[Kick webhook] KICK_WEBHOOK_SECRET not set — skipping verification')
    return true
  }

  const signature = req.headers.get('Kick-Event-Signature')
  if (!signature) {
    return false
  }

  const expected = createHmac('sha256', config.KICK_WEBHOOK_SECRET).update(body).digest('hex')

  // Constant-time compare
  return signature === `sha256=${expected}`
}

// ============================================================
// Normalization helpers
// ============================================================

function normalizeBadges(
  badges: { text: string; type: string; count?: number }[] | undefined,
): Badge[] {
  if (!badges) {
    return []
  }
  return badges.map((b) => ({ id: b.type, text: b.text, type: b.type }))
}

function normalizeChatMessage(payload: ChatMessagePayload): NormalizedChatMessage {
  const { sender } = payload
  const badges = normalizeBadges(sender.identity?.badges)

  return {
    author: {
      avatarUrl: sender.profile_picture ?? undefined,
      badges,
      color: sender.identity?.username_color ?? undefined,
      displayName: sender.username ?? 'anonymous',
      id: String(sender.user_id ?? 'anon'),
    },
    channelId: String(payload.broadcaster.user_id ?? payload.broadcaster.channel_slug ?? ''),
    emotes: payload.emotes.map((e) => ({
      id: e.emote_id,
      name: e.emote_id,
      imageUrl: `https://files.kick.com/emotes/${e.emote_id}/fullsize`,
      positions: e.positions.map((p) => ({ start: p.s, end: p.e })),
    })),
    id: payload.message_id,
    platform: 'kick',
    text: payload.content,
    timestamp: new Date(payload.created_at),
    type: 'message',
  }
}

// ============================================================
// Main webhook handler
// ============================================================

export async function handleKickWebhook(req: Request): Promise<Response> {
  const body = await req.text()

  const valid = await verifyKickSignature(req, body)
  if (!valid) {
    return new Response('Invalid signature', { status: 401 })
  }

  const eventType = req.headers.get('Kick-Event-Type') ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  try {
    await dispatchKickEvent(eventType, parsed)
  } catch (error) {
    console.error(`[Kick webhook] Error dispatching ${eventType}:`, error)
  }

  return new Response('OK', { status: 200 })
}

async function dispatchKickEvent(eventType: string, payload: unknown): Promise<void> {
  switch (eventType) {
    case 'chat.message.sent': {
      const msg = normalizeChatMessage(payload as ChatMessagePayload)
      // Find the client that owns this broadcaster's channel and push the message
      await pushToChannelOwner(payload as ChatMessagePayload, {
        data: msg,
        type: 'chat_message',
      })
      break
    }

    case 'channel.followed': {
      const p = payload as ChannelFollowPayload
      const event: NormalizedEvent = {
        data: { channelSlug: p.broadcaster.channel_slug },
        id: `kick:follow:${p.follower.user_id}:${Date.now()}`,
        platform: 'kick',
        timestamp: new Date(),
        type: 'follow',
        user: {
          avatarUrl: p.follower.profile_picture ?? undefined,
          displayName: p.follower.username ?? 'anonymous',
          id: String(p.follower.user_id ?? 'anon'),
        },
      }
      await pushToChannelOwner(p, { data: event, type: 'chat_event' })
      break
    }

    case 'channel.subscription.new':
    case 'channel.subscription.renewal': {
      const p = payload as ChannelSubscriptionPayload
      const event: NormalizedEvent = {
        data: { channelSlug: p.broadcaster.channel_slug, duration: p.duration },
        id: `kick:sub:${p.subscriber.user_id}:${p.created_at}`,
        platform: 'kick',
        timestamp: new Date(p.created_at),
        type: eventType === 'channel.subscription.renewal' ? 'resub' : 'sub',
        user: {
          avatarUrl: p.subscriber.profile_picture ?? undefined,
          displayName: p.subscriber.username ?? 'anonymous',
          id: String(p.subscriber.user_id ?? 'anon'),
        },
      }
      await pushToChannelOwner(p, { data: event, type: 'chat_event' })
      break
    }

    case 'channel.subscription.gifts': {
      const p = payload as ChannelSubscriptionGiftsPayload
      // One event per giftee
      for (const giftee of p.giftees) {
        const event: NormalizedEvent = {
          data: {
            channelSlug: p.broadcaster.channel_slug,
            gifteeId: giftee.user_id,
            gifteeUsername: giftee.username,
          },
          id: `kick:giftsub:${p.gifter.user_id}:${giftee.user_id}:${p.created_at}`,
          platform: 'kick',
          timestamp: new Date(p.created_at),
          type: 'gift_sub',
          user: {
            avatarUrl: p.gifter.profile_picture ?? undefined,
            displayName: p.gifter.username ?? 'anonymous',
            id: String(p.gifter.user_id ?? 'anon'),
          },
        }
        await pushToChannelOwner(p, { data: event, type: 'chat_event' })
      }
      break
    }

    default: {
      console.log(`[Kick webhook] Unhandled event type: ${eventType}`)
    }
  }
}

// Find which connected desktop client owns the broadcaster's channel and push to them.
// We look up the platform_account whose platform_user_id matches the broadcaster's user_id.
async function pushToChannelOwner(
  payload: { broadcaster: KickUser },
  message: Parameters<typeof connectionManager.send>[1],
): Promise<void> {
  const broadcasterId = payload.broadcaster.user_id
  if (!broadcasterId) {
    // Fallback: broadcast to all connected clients (shouldn't happen in practice)
    connectionManager.broadcast(message)
    return
  }

  const { sql } = Bun
  const rows = await sql<{ client_secret: string }[]>`
    SELECT client_secret FROM platform_accounts
    WHERE platform = 'kick' AND platform_user_id = ${String(broadcasterId)}
  `

  if (rows.length === 0) {
    console.warn(`[Kick webhook] No client found for broadcaster ${broadcasterId}`)
    return
  }

  for (const row of rows) {
    connectionManager.send(row.client_secret, message)
  }
}
