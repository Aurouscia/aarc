<script setup lang="ts">
import { SliceKind, AnySlice } from '@/models/save';
import type { Component } from 'vue';
import { getSliceIndices } from './sliceEditor';

const props = defineProps<{
    slice: AnySlice
    col: SliceKind
    editorComponent: Component
    panelClass: string
    resizingSliceId?: number
    flashingRowIdx?: number
}>()

const emit = defineEmits<{
    change: []
    resizeTop: []
    resizeBottom: []
    delete: []
    cancelResize: []
}>()

const indices = getSliceIndices(props.slice, props.col)
const isResizing = props.resizingSliceId === props.slice.id
const isFlashingTop = props.flashingRowIdx === indices?.fromIdx
</script>

<template>
  <div :class="['editor-panel', panelClass]">
    <component :is="editorComponent" :slice="slice" @change="emit('change')" />
    <div v-if="isResizing" class="resize-hint">
      <span>请选择新{{ isFlashingTop ? '上' : '下' }}点</span>
      <button @click="emit('cancelResize')">取消</button>
    </div>
    <div v-else class="editor-btns">
      <button @click="emit('resizeTop')">重设上点</button>
      <button @click="emit('resizeBottom')">重设下点</button>
      <button @click="emit('delete')" class="cancel">删除片段</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-panel {
  padding: 8px;
  border-radius: 4px;
}

.editor-btns {
  display: flex;
  margin-top: 8px;

  button {
    flex: 1;
  }
}

.resize-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.editor-panel.time {
  background: #bbdefb;
  &:deep(.editorTitle) {
    color: #2196f3;
  }
}

.editor-panel.style {
  background: #c8e6c9;
  &:deep(.editorTitle) {
    color: #4caf50;
  }
}
</style>
