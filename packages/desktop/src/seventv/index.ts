import type { Platform, SevenTVEmote } from '@twirchat/shared'
import { getBackendUrl } from '../runtime-config'

interface EmoteSetData {
  platform: Platform
  channelId: string
  emotes: Map<string, SevenTVEmote> // Alias -> emote
}

class DesktopSevenTVService {
  private emoteSets = new Map<string, EmoteSetData>() // ChannelKey -> emoteSet
  private _backendUrl: string | null = null

  private getChannelKey(platform: Platform, channelId: string): string {
    return `${platform}:${channelId}`
  }

  private get backendUrl(): string {
    if (!this._backendUrl) {
      this._backendUrl = getBackendUrl()
    }
    return this._backendUrl
  }

  // Subscribe to 7TV emotes for a channel (called when joining a channel)
  async subscribeToChannel(platform: Platform, channelId: string): Promise<void> {
    const channelKey = this.getChannelKey(platform, channelId)

    // Send via backend WebSocket
    const message = {
      channelId,
      platform,
      type: 'seventv_subscribe' as const,
    }

    // This will be sent via the existing backend connection
    this.sendToBackend(message)
  }

  // Unsubscribe when leaving channel
  async unsubscribeFromChannel(platform: Platform, channelId: string): Promise<void> {
    const channelKey = this.getChannelKey(platform, channelId)

    // Remove from local cache
    this.emoteSets.delete(channelKey)

    // Send via backend WebSocket
    const message = {
      channelId,
      platform,
      type: 'seventv_unsubscribe' as const,
    }

    this.sendToBackend(message)
  }

  // Called on reconnect - resubscribe to all channels
  async resubscribeToChannels(
    subscriptions: { platform: Platform; channelId: string }[],
  ): Promise<void> {
    const message = {
      subscriptions,
      type: 'seventv_resubscribe' as const,
    }

    this.sendToBackend(message)
  }

  // Handle incoming emote set from backend
  handleEmoteSet(platform: Platform, channelId: string, emotes: SevenTVEmote[]): void {
    const channelKey = this.getChannelKey(platform, channelId)
    const emoteMap = new Map<string, SevenTVEmote>()

    for (const emote of emotes) {
      emoteMap.set(emote.alias.toLowerCase(), emote)
    }

    this.emoteSets.set(channelKey, {
      channelId,
      emotes: emoteMap,
      platform,
    })
  }

  // Handle emote added
  handleEmoteAdded(platform: Platform, channelId: string, emote: SevenTVEmote): void {
    const channelKey = this.getChannelKey(platform, channelId)
    const emoteSet = this.emoteSets.get(channelKey)

    if (emoteSet) {
      emoteSet.emotes.set(emote.alias.toLowerCase(), emote)
    }
  }

  // Handle emote removed
  handleEmoteRemoved(platform: Platform, channelId: string, emoteId: string): void {
    const channelKey = this.getChannelKey(platform, channelId)
    const emoteSet = this.emoteSets.get(channelKey)

    if (emoteSet) {
      // Find and remove by ID
      for (const [alias, emote] of emoteSet.emotes) {
        if (emote.id === emoteId) {
          emoteSet.emotes.delete(alias)
          break
        }
      }
    }
  }

  // Handle emote updated (renamed)
  handleEmoteUpdated(
    platform: Platform,
    channelId: string,
    emoteId: string,
    newAlias: string,
  ): void {
    const channelKey = this.getChannelKey(platform, channelId)
    const emoteSet = this.emoteSets.get(channelKey)

    if (emoteSet) {
      // Find by ID and update alias
      for (const [alias, emote] of emoteSet.emotes) {
        if (emote.id === emoteId) {
          emoteSet.emotes.delete(alias)
          emote.alias = newAlias.toLowerCase()
          emoteSet.emotes.set(emote.alias, emote)
          break
        }
      }
    }
  }

  // Get proxied image URL
  getImageUrl(emoteId: string, size: string = '4x'): string {
    return `${this.backendUrl}/proxy/7tv/${emoteId}?size=${size}`
  }

  // Lookup emote by alias for a channel
  getEmote(platform: Platform, channelId: string, alias: string): SevenTVEmote | undefined {
    const channelKey = this.getChannelKey(platform, channelId)
    const emoteSet = this.emoteSets.get(channelKey)

    if (!emoteSet) {
      return undefined
    }

    return emoteSet.emotes.get(alias.toLowerCase())
  }

  // Get all emotes for a channel
  getEmotes(platform: Platform, channelId: string): SevenTVEmote[] {
    const channelKey = this.getChannelKey(platform, channelId)
    const emoteSet = this.emoteSets.get(channelKey)

    if (!emoteSet) {
      return []
    }

    return [...emoteSet.emotes.values()]
  }

  // Get all subscribed channels
  getSubscribedChannels(): { platform: Platform; channelId: string }[] {
    return [...this.emoteSets.values()].map((set) => ({
      channelId: set.channelId,
      platform: set.platform,
    }))
  }

  // This will be set by the backend connection module
  sendToBackend: (message: unknown) => void = () => {
    console.warn('[7TV] sendToBackend not initialized')
  }
}

// Export singleton instance
export const sevenTVService = new DesktopSevenTVService()
