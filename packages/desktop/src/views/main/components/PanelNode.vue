<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  PanelNode,
  SplitDirection,
  AppSettings,
  NormalizedChatMessage,
  Account,
  PlatformStatusInfo,
  WatchedChannel,
} from '@twirchat/shared/types'
import ChatList from './ChatList.vue'

const props = defineProps<{
  panel: PanelNode
  messages?: NormalizedChatMessage[]
  settings?: AppSettings | null
  accounts?: Account[]
  statuses?: Map<string, PlatformStatusInfo>
  watchedMessages?: Map<string, NormalizedChatMessage[]>
  watchedStatuses?: Map<string, PlatformStatusInfo>
  watchedChannels?: WatchedChannel[]
  isDraggable?: boolean
  isDropTarget?: boolean
  isDragging?: boolean
}>()

const emit = defineEmits<{
  split: [panelId: string, direction: SplitDirection]
  remove: [panelId: string]
  assign: [panelId: string, channelId: string | null]
  'add-and-assign': [panelId: string, platform: 'twitch' | 'kick' | 'youtube', channelSlug: string]
  'settings-change': [settings: AppSettings]
  'send-watched': [payload: { text: string; channelId: string }]
  dragstart: [panelId: string]
  dragend: []
  dragover: [panelId: string]
  dragleave: []
  drop: [targetId: string]
}>()

const isMain = computed(() => props.panel.content.type === 'main')
const isWatched = computed(() => props.panel.content.type === 'watched')
const isEmpty = computed(() => props.panel.content.type === 'empty')

const channelId = computed(() => {
  if (props.panel.content.type === 'watched') {
    return props.panel.content.channelId
  }
  return null
})

const watchedChannel = computed(() => {
  if (!channelId.value || !props.watchedChannels) return null
  return props.watchedChannels.find((ch) => ch.id === channelId.value) ?? null
})

const watchedChannelStatus = computed(() => {
  if (!channelId.value || !props.watchedStatuses) return null
  return props.watchedStatuses.get(channelId.value) ?? null
})

const watchedChannelMessages = computed(() => {
  if (!channelId.value || !props.watchedMessages) return []
  return props.watchedMessages.get(channelId.value) ?? []
})

const showMenu = ref(false)
const showChannelSelector = ref(false)
const newChannelPlatform = ref<'twitch' | 'kick' | 'youtube'>('twitch')
const newChannelSlug = ref('')

const handleAddAndAssign = () => {
  const slug = newChannelSlug.value.trim().toLowerCase()
  if (!slug) return
  emit('add-and-assign', props.panel.id, newChannelPlatform.value, slug)
  newChannelSlug.value = ''
  showChannelSelector.value = false
}

const handleSplitHorizontal = () => {
  emit('split', props.panel.id, 'horizontal')
}

const handleSplitVertical = () => {
  emit('split', props.panel.id, 'vertical')
}

const handleRemove = () => {
  if (isMain.value) return
  emit('remove', props.panel.id)
}

const handleSettingsChange = (s: AppSettings) => {
  emit('settings-change', s)
}

const handleSendWatched = (payload: { text: string; channelId: string }) => {
  emit('send-watched', payload)
}

function toggleChannelSelector() {
  showChannelSelector.value = !showChannelSelector.value
  newChannelSlug.value = ''
  showMenu.value = false
}

function splitHorizontalAndClose() {
  handleSplitHorizontal()
  showMenu.value = false
}

function splitVerticalAndClose() {
  handleSplitVertical()
  showMenu.value = false
}

function removeAndClose() {
  handleRemove()
  showMenu.value = false
}

const handleDragStart = (e: DragEvent) => {
  if (!props.isDraggable) {
    e.preventDefault()
    return
  }
  emit('dragstart', props.panel.id)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.panel.id)
  }
}

const handleDragEnd = () => {
  emit('dragend')
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  emit('dragover', props.panel.id)
}

const handleDragLeave = () => {
  emit('dragleave')
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  emit('drop', props.panel.id)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!e.ctrlKey) return

  switch (e.key) {
    case 'h':
      if (e.shiftKey) {
        e.preventDefault()
        handleSplitVertical()
      } else {
        e.preventDefault()
        handleSplitHorizontal()
      }
      break
    case 'w':
      if (!isMain.value) {
        e.preventDefault()
        handleRemove()
      }
      break
  }
}
</script>

<template>
  <div
    class="panel-node"
    :class="{
      'is-dragging': isDragging,
      'is-drop-target': isDropTarget,
      'is-draggable': isDraggable,
    }"
    tabindex="0"
    :draggable="isDraggable"
    @keydown="handleKeydown"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="panel-header">
      <!-- Transparent overlay to close menu on outside-click -->
      <div v-if="showMenu" class="menu-overlay" @click="showMenu = false" />

      <!-- Left spacer (empty, for symmetry) -->
      <div class="panel-header-side" />

      <!-- Center: channel name -->
      <div class="panel-header-center">
        <span v-if="watchedChannel" class="panel-channel-name">{{
          watchedChannel.displayName
        }}</span>
        <span v-else-if="isMain" class="panel-channel-name">Combined Chat</span>
        <span v-else class="panel-channel-name muted">Empty</span>
      </div>

      <!-- Right: ⋮ menu button -->
      <div class="panel-header-side panel-header-right">
        <button class="panel-menu-btn" @click.stop="showMenu = !showMenu">⋮</button>
        <div v-if="showMenu" class="panel-menu-dropdown">
          <button v-if="isWatched || isEmpty" class="menu-item" @click="toggleChannelSelector">
            📺 Change channel
          </button>
          <button class="menu-item" @click="splitHorizontalAndClose">⬌ Split horizontal</button>
          <button class="menu-item" @click="splitVerticalAndClose">⬍ Split vertical</button>
          <div v-if="!isMain" class="menu-divider" />
          <button v-if="!isMain" class="menu-item menu-item-danger" @click="removeAndClose">
            ✕ Close panel
          </button>
        </div>
      </div>
    </div>

    <div v-if="showChannelSelector && (isEmpty || isWatched)" class="channel-selector">
      <div class="channel-selector-header">
        <span>Add Channel</span>
        <button class="close-btn" @click="showChannelSelector = false">×</button>
      </div>
      <div class="platform-row">
        <button
          class="platform-btn"
          :class="{ active: newChannelPlatform === 'twitch' }"
          style="--p-color: #9146ff"
          @click="newChannelPlatform = 'twitch'"
        >
          Twitch
        </button>
        <button
          class="platform-btn"
          :class="{ active: newChannelPlatform === 'kick' }"
          style="--p-color: #53fc18"
          @click="newChannelPlatform = 'kick'"
        >
          Kick
        </button>
        <button
          class="platform-btn"
          :class="{ active: newChannelPlatform === 'youtube' }"
          style="--p-color: #ff0000"
          @click="newChannelPlatform = 'youtube'"
        >
          YouTube
        </button>
      </div>
      <input
        v-model="newChannelSlug"
        class="channel-input"
        placeholder="Channel name"
        @keydown.enter="handleAddAndAssign"
        @keydown.escape="showChannelSelector = false"
      />
      <button class="btn-add" :disabled="!newChannelSlug.trim()" @click="handleAddAndAssign">
        Add
      </button>
    </div>

    <div class="panel-content">
      <ChatList
        v-if="isMain"
        :messages="messages ?? []"
        :settings="settings ?? null"
        :accounts="accounts ?? []"
        :statuses="statuses ?? new Map()"
        @settings-change="handleSettingsChange"
      />

      <ChatList
        v-else-if="isWatched && watchedChannel"
        :messages="watchedChannelMessages"
        :settings="settings ?? null"
        :accounts="accounts ?? []"
        :statuses="statuses ?? new Map()"
        :watched-channel="watchedChannel"
        :watched-channel-status="watchedChannelStatus"
        :watched-messages="watchedChannelMessages"
        @settings-change="handleSettingsChange"
        @send-watched="handleSendWatched"
      />

      <div v-else class="content-placeholder empty">
        <div class="empty-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <p>Empty panel</p>
        <p class="empty-hint">Click ⋮ to assign a channel or split this panel</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-node {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--c-bg, #0f0f11);
  border: 1px solid var(--c-border, #2a2a33);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: var(--c-surface, #18181b);
  border-bottom: 1px solid var(--c-border, #2a2a33);
  min-height: 40px;
  flex-shrink: 0;
  position: relative;
}

.panel-header-side {
  width: 32px;
  flex-shrink: 0;
}

.panel-header-center {
  flex: 1;
  text-align: center;
  overflow: hidden;
}

.panel-channel-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text, #e2e2e8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-channel-name.muted {
  color: var(--c-text-2, #8b8b99);
  font-weight: 400;
}

.panel-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}

.panel-menu-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--c-text-2, #8b8b99);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.panel-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--c-text, #e2e2e8);
}

.panel-menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--c-surface, #18181b);
  border: 1px solid var(--c-border, #2a2a33);
  border-radius: 8px;
  padding: 4px;
  min-width: 180px;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 199;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--c-text, #e2e2e8);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: background 0.15s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item-danger {
  color: #ef4444;
}

.menu-item-danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

.menu-divider {
  height: 1px;
  background: var(--c-border, #2a2a33);
  margin: 4px 0;
}

.channel-selector {
  position: absolute;
  top: 48px;
  right: 12px;
  background: var(--c-surface, #18181b);
  border: 1px solid var(--c-border, #2a2a33);
  border-radius: 8px;
  padding: 8px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.channel-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
  border-bottom: 1px solid var(--c-border, #2a2a33);
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-2, #8b8b99);
}

.close-btn {
  background: none;
  border: none;
  color: var(--c-text-2, #8b8b99);
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: var(--c-text, #e2e2e8);
}

.platform-row {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.platform-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--c-border, #2a2a33);
  color: var(--c-text-2, #8b8b99);
  padding: 4px 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.platform-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--c-text, #e2e2e8);
}

.platform-btn.active {
  background: var(--p-color);
  border-color: var(--p-color);
  color: #fff;
}

.platform-btn.active[style*='53fc18'] {
  color: #000;
}

.channel-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--c-border, #2a2a33);
  color: var(--c-text, #e2e2e8);
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 8px;
  outline: none;
}

.channel-input:focus {
  border-color: #a78bfa;
}

.btn-add {
  width: 100%;
  background: #a78bfa;
  color: #fff;
  border: none;
  padding: 6px 0;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-add:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;
  color: var(--c-text-2, #8b8b99);
  text-align: center;
  padding: 20px;
}

.empty-icon {
  color: var(--c-text-2, #8b8b99);
  opacity: 0.5;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

.panel-node.is-draggable {
  cursor: grab;
}

.panel-node.is-dragging {
  cursor: grabbing;
  opacity: 0.5;
}

.panel-node.is-drop-target {
  border: 2px dashed #a78bfa;
  background: rgba(167, 139, 250, 0.1);
}
</style>
