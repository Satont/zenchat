import { beforeEach, describe, expect, mock, test } from 'bun:test'

mock.module('vue', () => ({
  ref: <T>(value: T) => ({ value }),
}))

const mockRpc = {
  addMessageListener: mock(() => {}),
  removeMessageListener: mock(() => {}),
  request: {
    getChannelEmotes: mock(async (_args: { platform: string; channelId: string }) => {
      return [
        {
          id: '1',
          alias: 'Kappa',
          name: 'Kappa',
          animated: false,
          zeroWidth: false,
          aspectRatio: 1,
          imageUrl: 'https://example.com/kappa.webp',
        },
      ]
    }),
  },
}

mock.module('../src/views/main/main', () => ({
  rpc: mockRpc,
}))

const { useEmoteCache } = await import('../src/views/main/composables/useEmoteCache')

describe('useEmoteCache', () => {
  beforeEach(() => {
    mockRpc.request.getChannelEmotes.mockClear()
  })

  test('two calls return the same reactive Map reference', () => {
    const a = useEmoteCache()
    const b = useEmoteCache()

    expect(a.emoteCache).toBe(b.emoteCache)
  })

  test('loadEmotes populates cache under platform:channelId key', async () => {
    const { emoteCache, loadEmotes } = useEmoteCache()

    await loadEmotes('twitch', 'testchannel')

    expect(emoteCache.value.has('twitch:testchannel')).toBe(true)
    const emotes = emoteCache.value.get('twitch:testchannel')
    expect(emotes?.[0]?.alias).toBe('Kappa')
  })

  test('loadEmotes is idempotent — does not call RPC twice for same key', async () => {
    const { loadEmotes } = useEmoteCache()

    await loadEmotes('twitch', 'testchannel')
    mockRpc.request.getChannelEmotes.mockClear()

    await loadEmotes('twitch', 'testchannel')

    expect(mockRpc.request.getChannelEmotes).toHaveBeenCalledTimes(0)
  })
})
