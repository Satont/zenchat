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
import AddChannelForm from './AddChannelForm.vue'

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

const youtubeAuthenticated = computed(
  () => props.accounts?.some((a) => a.platform === 'youtube') ?? false,
)

const showMenu = ref(false)
const showAddForm = ref(false)

const showForm = computed(() => isEmpty.value || showAddForm.value)

function handleFormConfirm(platform: 'twitch' | 'kick' | 'youtube', slug: string) {
  emit('add-and-assign', props.panel.id, platform, slug)
  showAddForm.value = false
}

const handleSplitHorizontal = () => {
  emit('split', props.panel.id, 'horizontal')
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

function toggleAddForm() {
  showAddForm.value = !showAddForm.value
  showMenu.value = false
}

function handleCancelForm() {
  showAddForm.value = false
}

function handleSplitAndClose() {
  emit('split', props.panel.id, 'vertical')
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
        emit('split', props.panel.id, 'vertical')
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
    }"
    tabindex="0"
    @keydown="handleKeydown"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      class="panel-header"
      :class="{ 'is-drag-handle': isDraggable }"
      :draggable="isDraggable"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
      <div v-if="showMenu" class="menu-overlay" @click="showMenu = false" />
      <div class="panel-header-side" />
      <div class="panel-header-center">
        <span v-if="watchedChannel && !showAddForm" class="panel-channel-name">{{
          watchedChannel.displayName
        }}</span>
        <span v-else-if="isMain" class="panel-channel-name">Combined Chat</span>
        <span v-else class="panel-channel-name muted">{{
          showAddForm ? 'Add Channel' : 'Empty'
        }}</span>
      </div>
      <div class="panel-header-side panel-header-right">
        <!-- + split button (non-main panels only) -->
        <button
          v-if="!isMain"
          class="panel-add-btn"
          title="Split right"
          @click.stop="handleSplitAndClose"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <!-- ⋮ menu button -->
        <button class="panel-menu-btn" @click.stop="showMenu = !showMenu">⋮</button>
        <div v-if="showMenu" class="panel-menu-dropdown">
          <button v-if="isWatched" class="menu-item" @click="toggleAddForm">
            📺 Change channel
          </button>
          <div v-if="!isMain" class="menu-divider" />
          <button v-if="!isMain" class="menu-item menu-item-danger" @click="removeAndClose">
            ✕ Close panel
          </button>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <!-- Add-channel form: shown when empty OR user toggled change channel -->
      <div v-if="showForm" class="add-channel-form-wrapper">
        <AddChannelForm
          :youtube-authenticated="youtubeAuthenticated"
          :cancelable="isWatched && showAddForm"
          @confirm="handleFormConfirm"
          @cancel="handleCancelForm"
        />
      </div>

      <!-- Main chat (combined) -->
      <ChatList
        v-else-if="isMain"
        :messages="messages ?? []"
        :settings="settings ?? null"
        :accounts="accounts ?? []"
        :statuses="statuses ?? new Map()"
        @settings-change="handleSettingsChange"
      />

      <!-- Watched channel chat -->
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

/* Drag handle styles */
.panel-header.is-drag-handle {
  cursor: grab;
  user-select: none;
}
.panel-header.is-drag-handle:active {
  cursor: grabbing;
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
  /* Override the fixed width to fit both buttons */
  width: auto;
  min-width: 32px;
}

/* + split button */
.panel-add-btn {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--c-text-2, #8b8b99);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  margin-right: 2px;
}
.panel-add-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--c-text, #e2e2e8);
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

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Add channel form — fullscreen in panel content */
.add-channel-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
}
.add-channel-form-wrapper > * {
  max-width: 260px;
}

.panel-node.is-dragging {
  opacity: 0.5;
}

.panel-node.is-drop-target {
  border: 2px dashed #a78bfa;
  background: rgba(167, 139, 250, 0.1);
}
</style>
