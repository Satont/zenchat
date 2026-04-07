<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  youtubeAuthenticated?: boolean
  cancelable?: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  confirm: [platform: 'twitch' | 'kick' | 'youtube', channelSlug: string]
  cancel: []
}>()

const platform = ref<'twitch' | 'kick' | 'youtube'>('twitch')
const channelSlug = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const placeholder = computed(() => {
  if (platform.value === 'twitch') {
    return 'Twitch channel name'
  }
  if (platform.value === 'kick') {
    return 'Kick channel name'
  }
  return 'YouTube channel handle or ID'
})

function selectPlatform(p: 'twitch' | 'kick' | 'youtube') {
  if (p === 'youtube' && !props.youtubeAuthenticated) {
    return
  }
  platform.value = p
}

function onConfirm() {
  const slug = channelSlug.value.trim().toLowerCase()
  if (!slug) {
    return
  }
  emit('confirm', platform.value, slug)
  channelSlug.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    onConfirm()
  }
  if (e.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div class="add-channel-form" :class="{ 'is-compact': compact }" @keydown="onKeydown">
    <!-- Platform selector -->
    <div class="platform-row">
      <button
        class="platform-btn"
        :class="{ active: platform === 'twitch' }"
        style="--p-color: #9146ff"
        @click="selectPlatform('twitch')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"
          />
        </svg>
        Twitch
      </button>
      <button
        class="platform-btn"
        :class="{ active: platform === 'kick' }"
        style="--p-color: #53fc18"
        @click="selectPlatform('kick')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 2h4v7.5l5-7.5h5l-6 9 6 11h-5l-5-8V22H3z" />
        </svg>
        Kick
      </button>
      <button
        class="platform-btn"
        :class="{ active: platform === 'youtube', disabled: !youtubeAuthenticated }"
        :title="youtubeAuthenticated ? undefined : 'Log in to YouTube first'"
        style="--p-color: #ff0000"
        @click="selectPlatform('youtube')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
          />
        </svg>
        YouTube
        <svg
          v-if="!youtubeAuthenticated"
          class="lock-icon"
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </button>
    </div>

    <!-- Channel input -->
    <div class="input-row">
      <input
        ref="inputEl"
        v-model="channelSlug"
        class="channel-input"
        :placeholder="placeholder"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button v-if="cancelable" class="btn-cancel" @click="emit('cancel')">Cancel</button>
      <button class="btn-confirm" :disabled="!channelSlug.trim()" @click="onConfirm">Add</button>
    </div>
  </div>
</template>

<style scoped>
.add-channel-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.add-channel-form.is-compact {
  gap: 12px;
}

.platform-row {
  display: flex;
  gap: 8px;
}

.platform-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--c-text-2, #8b8b99);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.platform-btn.active {
  background: color-mix(in srgb, var(--p-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--p-color) 45%, transparent);
  color: var(--p-color);
}
.platform-btn:not(.active):not(.disabled):hover {
  background: rgba(255, 255, 255, 0.07);
  color: var(--c-text, #e2e2e8);
}
.platform-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.lock-icon {
  opacity: 0.7;
  flex-shrink: 0;
}

.input-row {
  display: flex;
}

.channel-input {
  flex: 1;
  background: var(--c-surface-2, #1f1f24);
  border: 1px solid var(--c-border, #2a2a33);
  border-radius: 8px;
  color: var(--c-text, #e2e2e8);
  font-family: inherit;
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.15s;
}
.channel-input:focus {
  border-color: rgba(167, 139, 250, 0.5);
}
.channel-input::placeholder {
  color: var(--c-text-2, #8b8b99);
  opacity: 0.6;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: none;
  color: var(--c-text-2, #8b8b99);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--c-text, #e2e2e8);
}

.btn-confirm {
  padding: 7px 16px;
  border-radius: 8px;
  border: none;
  background: #7c3aed;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;
}
.btn-confirm:hover:not(:disabled) {
  background: #6d28d9;
}
.btn-confirm:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
