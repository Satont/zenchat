import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import type {
  NormalizedChatMessage,
  PlatformStatusInfo,
  WatchedChannel,
} from '@twirchat/shared/types'
import type { SevenTVEmote } from '@twirchat/shared/protocol'

import { fuzzyFilter } from '../utils/fuzzyFilter'
import { mentionColorCache } from './useMessageParsing'
import { useEmoteStore } from '../stores/emoteStore'
import {
  parseToken,
  replaceToken,
  type AutocompleteSuggestion,
  type EmoteSuggestion,
  type MentionSuggestion,
  type ParsedToken,
} from '../utils/autocompleteUtils'

export type { AutocompleteSuggestion, EmoteSuggestion, MentionSuggestion, ParsedToken }
export { parseToken, replaceToken }

export function useAutocomplete(params: {
  text: Ref<string>
  messages: Ref<NormalizedChatMessage[]>
  watchedChannel: Ref<WatchedChannel | null | undefined>
  statuses: Ref<Map<string, PlatformStatusInfo>>
}): {
  suggestions: ComputedRef<AutocompleteSuggestion[]>
  isOpen: ComputedRef<boolean>
  selectedIndex: Ref<number>
  mode: ComputedRef<'mention' | 'emote' | null>
  selectSuggestion: (index: number) => void
  moveUp: () => void
  moveDown: () => void
  close: () => void
} {
  const { text, messages, watchedChannel, statuses } = params

  const emoteStore = useEmoteStore()
  const closedQuery = ref('')
  const selectedIndex = ref(0)

  const token = computed(() => parseToken(text.value))
  const mode = computed(() => token.value.mode)
  const query = computed(() => token.value.query)

  const mentionSuggestions = computed((): MentionSuggestion[] => {
    const seen = new Set<string>()
    const result: MentionSuggestion[] = []

    for (const msg of messages.value) {
      const lower = msg.author.displayName.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)

      result.push({
        type: 'mention',
        label: msg.author.displayName,
        color: mentionColorCache.get(`${msg.platform}:${lower}`) ?? null,
      })
    }

    return result
  })

  function getCurrentChannelKey(): { platform: string; channelId: string } | null {
    const wc = watchedChannel.value
    if (wc) {
      return { platform: wc.platform, channelId: wc.channelSlug }
    }

    for (const [_key, info] of statuses.value) {
      if (info.channelLogin && info.status === 'connected') {
        return { platform: info.platform, channelId: info.channelLogin }
      }
    }

    return null
  }

  const emoteSuggestions = computed((): EmoteSuggestion[] => {
    const ch = getCurrentChannelKey()
    if (!ch) return []

    const emotes = emoteStore.emoteMap.get(`${ch.platform}:${ch.channelId}`) ?? []

    return emotes.map(
      (e: SevenTVEmote): EmoteSuggestion => ({
        type: 'emote',
        label: e.alias,
        imageUrl: e.imageUrl,
        animated: e.animated,
      }),
    )
  })

  const suggestions = computed((): AutocompleteSuggestion[] => {
    const m = mode.value
    const q = query.value

    if (!m || !q) return []

    if (m === 'mention') {
      return fuzzyFilter(mentionSuggestions.value, q).slice(0, 15) as AutocompleteSuggestion[]
    }

    return fuzzyFilter(emoteSuggestions.value, q).slice(0, 15) as AutocompleteSuggestion[]
  })

  const isOpen = computed(() => suggestions.value.length > 0 && query.value !== closedQuery.value)

  watch(text, () => {
    closedQuery.value = ''
  })

  watch(
    watchedChannel,
    (wc: WatchedChannel | null | undefined) => {
      if (wc) {
        void emoteStore.loadEmotes(wc.platform, wc.channelSlug)
      }
    },
    { immediate: true },
  )

  watch(
    statuses,
    () => {
      if (watchedChannel.value) return

      const ch = getCurrentChannelKey()
      if (ch) {
        void emoteStore.loadEmotes(ch.platform, ch.channelId)
      }
    },
    { immediate: true },
  )

  function selectSuggestion(index: number): void {
    const s = suggestions.value[index]
    if (!s) return
    text.value = replaceToken(text.value, s)
    selectedIndex.value = 0
    closedQuery.value = ''
  }

  function moveUp(): void {
    const len = suggestions.value.length
    if (len === 0) return
    selectedIndex.value = selectedIndex.value <= 0 ? len - 1 : selectedIndex.value - 1
  }

  function moveDown(): void {
    const len = suggestions.value.length
    if (len === 0) return
    selectedIndex.value = selectedIndex.value >= len - 1 ? 0 : selectedIndex.value + 1
  }

  function close(): void {
    closedQuery.value = query.value
    selectedIndex.value = 0
  }

  return {
    suggestions,
    isOpen,
    selectedIndex,
    mode,
    selectSuggestion,
    moveUp,
    moveDown,
    close,
  }
}
