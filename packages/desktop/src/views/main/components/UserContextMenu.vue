<script setup lang="ts">
import { ref } from 'vue'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
} from 'reka-ui'
import type { Platform } from '@twirchat/shared/types'
import { useAliasStore } from '../stores/useAliasStore'

interface Props {
  platform: Platform
  platformUserId: string
  displayName: string
  currentAlias?: string
}

const props = defineProps<Props>()

const aliasStore = useAliasStore()
const dialogOpen = ref(false)
const aliasValue = ref('')
const aliasInput = ref<HTMLInputElement | null>(null)

function openDialog() {
  aliasValue.value = props.currentAlias ?? ''
  dialogOpen.value = true
}

function focusInput() {
  aliasInput.value?.focus()
}

async function handleSaveAlias() {
  const val = aliasValue.value.trim()
  if (!val) {
    await aliasStore.removeAlias(props.platform, props.platformUserId)
  } else {
    await aliasStore.setAlias(props.platform, props.platformUserId, val)
  }
  dialogOpen.value = false
}

async function handleRemoveAlias() {
  await aliasStore.removeAlias(props.platform, props.platformUserId)
}
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="context-menu-content">
        <!-- Header -->
        <ContextMenuLabel class="context-menu-label">
          {{ displayName }} ({{ platform }})
        </ContextMenuLabel>

        <ContextMenuSeparator class="context-menu-separator" />

        <!-- Show current alias if set -->
        <ContextMenuLabel v-if="currentAlias" class="context-menu-alias-label">
          Alias: {{ currentAlias }}
        </ContextMenuLabel>

        <!-- Set/Edit alias → opens Dialog -->
        <ContextMenuItem class="context-menu-item" @select="openDialog">
          {{ currentAlias ? 'Edit alias' : 'Set alias' }}
        </ContextMenuItem>

        <!-- Remove alias → only shown if alias is set -->
        <ContextMenuItem
          v-if="currentAlias"
          class="context-menu-item context-menu-item-danger"
          @select="handleRemoveAlias"
        >
          Remove alias
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>

  <!-- Alias edit Dialog — separate from ContextMenu -->
  <DialogRoot v-model:open="dialogOpen">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent class="dialog-content" @open-auto-focus="focusInput">
        <h3 class="dialog-title">Set alias for {{ displayName }}</h3>
        <p class="dialog-description">
          Replaces the displayed name in chat. Leave empty to remove alias.
        </p>
        <input
          ref="aliasInput"
          v-model="aliasValue"
          class="dialog-input"
          :placeholder="displayName"
          maxlength="50"
          @keydown.enter.prevent="handleSaveAlias"
          @keydown.escape.prevent="dialogOpen = false"
        />
        <div class="dialog-actions">
          <button class="dialog-btn-cancel" @click="dialogOpen = false">Cancel</button>
          <button class="dialog-btn-save" @click="handleSaveAlias">Save</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.dialog-overlay {
  background: rgba(0, 0, 0, 0.6);
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.dialog-content {
  background: var(--c-bg-2, #2a2a35);
  border: 1px solid var(--c-border, #3a3a45);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 320px;
  padding: 20px;
  z-index: 2001;
}

.dialog-title {
  margin: 0 0 8px;
  font-size: 1.1em;
  color: var(--c-text, #e2e2e8);
}

.dialog-description {
  margin: 0 0 16px;
  font-size: 0.9em;
  color: var(--c-text-2, #8b8b99);
}

.dialog-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  background: var(--c-bg, #1e1e24);
  border: 1px solid var(--c-border, #3a3a45);
  color: var(--c-text, #e2e2e8);
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 0.95em;
}

.dialog-input:focus {
  outline: none;
  border-color: var(--c-accent, #9147ff);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-btn-cancel,
.dialog-btn-save {
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-weight: 500;
  font-size: 0.9em;
}

.dialog-btn-cancel {
  background: transparent;
  color: var(--c-text, #e2e2e8);
}

.dialog-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dialog-btn-save {
  background: var(--c-accent, #9147ff);
  color: #fff;
}

.dialog-btn-save:hover {
  opacity: 0.9;
}
</style>

<style>
/* Global styles — ContextMenuContent is portalled outside the component tree */
.context-menu-content {
  min-width: 160px;
  background-color: var(--c-surface-2, #1f1f24) !important;
  border: 1px solid var(--c-border, #2a2a33);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  color-scheme: dark;
}

.context-menu-label {
  padding: 6px 10px;
  font-size: 0.85em;
  color: var(--c-text-2, #8b8b99);
  font-weight: 600;
}

.context-menu-alias-label {
  padding: 0 10px 6px;
  font-size: 0.8em;
  color: var(--c-accent, #9147ff);
  font-style: italic;
}

.context-menu-item {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  color: var(--c-text, #e2e2e8);
  outline: none;
}

.context-menu-item:hover,
.context-menu-item[data-highlighted] {
  background: var(--c-bg, #1e1e24);
  color: var(--c-text, #e2e2e8);
}

.context-menu-item-danger {
  color: #ff5050;
}

.context-menu-item-danger:hover,
.context-menu-item-danger[data-highlighted] {
  background: rgba(255, 80, 80, 0.15);
  color: #ff5050;
}

.context-menu-separator {
  height: 1px;
  background: var(--c-border, #2a2a33);
  margin: 4px 0;
}
</style>
