import { ref } from 'vue'

import type { Platform } from '@twirchat/shared/types'
import type { SevenTVEmote } from '@twirchat/shared/protocol'

import { rpc } from '../main'

const emoteCache = ref<Map<string, SevenTVEmote[]>>(new Map())
let listenersRegistered = false

export function useEmoteCache(): {
  emoteCache: typeof emoteCache
  loadEmotes: (platform: string, channelId: string) => Promise<void>
} {
  if (!listenersRegistered) {
    listenersRegistered = true
    rpc.addMessageListener('channel_emotes_set', onEmotesSet)
    rpc.addMessageListener('channel_emote_added', onEmoteAdded)
    rpc.addMessageListener('channel_emote_removed', onEmoteRemoved)
    rpc.addMessageListener('channel_emote_updated', onEmoteUpdated)
  }

  return { emoteCache, loadEmotes }
}

async function loadEmotes(platform: string, channelId: string): Promise<void> {
  const key = `${platform}:${channelId}`
  if (emoteCache.value.has(key)) return

  try {
    const emotes = await rpc.request.getChannelEmotes({
      platform: platform as Platform,
      channelId,
    })
    const next = new Map(emoteCache.value)
    next.set(key, emotes)
    emoteCache.value = next
  } catch (err) {
    console.warn('[useEmoteCache] Failed to load emotes:', platform, channelId, err)
  }
}

function onEmotesSet(payload: {
  platform: Platform
  channelId: string
  emotes: SevenTVEmote[]
}): void {
  const key = `${payload.platform}:${payload.channelId}`
  const next = new Map(emoteCache.value)
  next.set(key, payload.emotes)
  emoteCache.value = next
}

function onEmoteAdded(payload: {
  platform: Platform
  channelId: string
  emote: SevenTVEmote
}): void {
  const key = `${payload.platform}:${payload.channelId}`
  const next = new Map(emoteCache.value)
  next.set(key, [...(emoteCache.value.get(key) ?? []), payload.emote])
  emoteCache.value = next
}

function onEmoteRemoved(payload: { platform: Platform; channelId: string; emoteId: string }): void {
  const key = `${payload.platform}:${payload.channelId}`
  const existing = emoteCache.value.get(key)
  if (!existing) return

  const next = new Map(emoteCache.value)
  next.set(
    key,
    existing.filter((e: SevenTVEmote) => e.id !== payload.emoteId),
  )
  emoteCache.value = next
}

function onEmoteUpdated(payload: {
  platform: Platform
  channelId: string
  emoteId: string
  newAlias: string
}): void {
  const key = `${payload.platform}:${payload.channelId}`
  const existing = emoteCache.value.get(key)
  if (!existing) return

  const next = new Map(emoteCache.value)
  next.set(
    key,
    existing.map((e: SevenTVEmote) => {
      if (e.id !== payload.emoteId) return e
      return Object.assign({}, e, { alias: payload.newAlias })
    }),
  )
  emoteCache.value = next
}
