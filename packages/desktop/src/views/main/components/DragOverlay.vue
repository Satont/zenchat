<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LayoutNode, PanelNode } from '@twirchat/shared/types'

const props = defineProps<{
  root: LayoutNode
  draggedPanelId: string | null
}>()

const emit = defineEmits<{
  drop: [panelId: string, zone: DropZone]
}>()

interface DropZone {
  targetId: string
  position: 'left' | 'right' | 'top' | 'bottom'
}

const isDragging = computed(() => !!props.draggedPanelId)

// Track hover state for each panel's drop zones
const hoverZones = ref<Set<string>>(new Set())

const handleZoneEnter = (zoneId: string) => {
  hoverZones.value.add(zoneId)
}

const handleZoneLeave = (zoneId: string) => {
  hoverZones.value.delete(zoneId)
}

const handleDrop = (targetId: string, position: DropZone['position']) => {
  if (!props.draggedPanelId) return

  emit('drop', props.draggedPanelId, {
    targetId,
    position,
  })

  hoverZones.value.clear()
}

const isZoneActive = (zoneId: string) => hoverZones.value.has(zoneId)
</script>

<template>
  <Teleport to="body">
    <div v-if="isDragging" class="drag-overlay">
      <!-- This overlay covers the entire viewport during drag -->
      <div class="drag-backdrop" />

      <!-- Drop zones are rendered for each panel -->
      <div v-for="panel in [] as PanelNode[]" :key="panel.id" class="panel-drop-zones">
        <!-- Left zone -->
        <div
          :class="['drop-zone', 'left', { active: isZoneActive(`${panel.id}-left`) }]"
          @mouseenter="handleZoneEnter(`${panel.id}-left`)"
          @mouseleave="handleZoneLeave(`${panel.id}-left`)"
          @mouseup="handleDrop(panel.id, 'left')"
        />

        <!-- Right zone -->
        <div
          :class="['drop-zone', 'right', { active: isZoneActive(`${panel.id}-right`) }]"
          @mouseenter="handleZoneEnter(`${panel.id}-right`)"
          @mouseleave="handleZoneLeave(`${panel.id}-right`)"
          @mouseup="handleDrop(panel.id, 'right')"
        />

        <!-- Top zone -->
        <div
          :class="['drop-zone', 'top', { active: isZoneActive(`${panel.id}-top`) }]"
          @mouseenter="handleZoneEnter(`${panel.id}-top`)"
          @mouseleave="handleZoneLeave(`${panel.id}-top`)"
          @mouseup="handleDrop(panel.id, 'top')"
        />

        <!-- Bottom zone -->
        <div
          :class="['drop-zone', 'bottom', { active: isZoneActive(`${panel.id}-bottom`) }]"
          @mouseenter="handleZoneEnter(`${panel.id}-bottom`)"
          @mouseleave="handleZoneLeave(`${panel.id}-bottom`)"
          @mouseup="handleDrop(panel.id, 'bottom')"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.drag-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

.panel-drop-zones {
  position: absolute;
  pointer-events: none;
}

.drop-zone {
  position: absolute;
  pointer-events: auto;
  background: rgba(167, 139, 250, 0.2);
  border: 2px solid transparent;
  transition: all 0.15s;
}

.drop-zone.active {
  background: rgba(167, 139, 250, 0.5);
  border-color: #a78bfa;
}

.drop-zone.left {
  left: 0;
  top: 0;
  bottom: 0;
  width: 33%;
}

.drop-zone.right {
  right: 0;
  top: 0;
  bottom: 0;
  width: 33%;
}

.drop-zone.top {
  top: 0;
  left: 33%;
  right: 33%;
  height: 50%;
}

.drop-zone.bottom {
  bottom: 0;
  left: 33%;
  right: 33%;
  height: 50%;
}
</style>
